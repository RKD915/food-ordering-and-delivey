import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, ExternalLink, Home, MapPin, Navigation, Phone, Star, Store, Truck } from 'lucide-react';
import API_BASE from '../config/api';
import styles from './DeliveryTracker.module.css';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const STATUS_STEPS = ['Placed', 'Preparing', 'Out for delivery', 'Delivered'];
let googleMapsPromise;

const formatArrivalTime = (value) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
};

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'FE';

const getActiveStep = (status = '') => {
  if (status === 'Delivered') return 3;
  if (status === 'Out for delivery' || status === 'Arriving') return 2;
  if (status === 'Preparing') return 1;
  return 0;
};

const getRouteString = (points = []) => points.map((point) => `${point.x},${point.y}`).join(' ');

const getProgressRoute = (route = [], driverLocation, progress = 0) => {
  if (!route.length || !driverLocation) return [];
  const segmentCount = route.length - 1;
  const currentSegment = Math.min(segmentCount - 1, Math.floor(progress * segmentCount));
  return [...route.slice(0, currentSegment + 1), driverLocation];
};

const loadGoogleMaps = () => {
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error('Google Maps key missing'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps="foodexpress"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'foodexpress';
      script.onload = () => resolve(window.google.maps);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
};

const GoogleDeliveryMap = ({ tracking }) => {
  const mapRef = useRef(null);
  const mapStateRef = useRef({
    map: null,
    directionsRenderer: null,
    driverMarker: null,
    restaurantMarker: null,
    customerMarker: null
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapRef.current) return;
        const origin = tracking.restaurantLocation;
        const destination = tracking.customerLocation;
        const map = new maps.Map(mapRef.current, {
          center: { lat: origin.lat, lng: origin.lng },
          zoom: 13,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false
        });
        const directionsRenderer = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: '#fc4c02',
            strokeOpacity: 0.9,
            strokeWeight: 5
          }
        });

        const restaurantMarker = new maps.Marker({
          map,
          position: { lat: origin.lat, lng: origin.lng },
          title: origin.label,
          label: 'K'
        });
        const customerMarker = new maps.Marker({
          map,
          position: { lat: destination.lat, lng: destination.lng },
          title: destination.label,
          label: 'Y'
        });
        const driverMarker = new maps.Marker({
          map,
          position: { lat: tracking.driverLocation.lat, lng: tracking.driverLocation.lng },
          title: 'Driver location',
          label: 'D'
        });

        const directionsService = new maps.DirectionsService();
        directionsService.route({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: maps.TravelMode.DRIVING,
          waypoints: (tracking.route || []).slice(1, -1).slice(0, 4).map((point) => ({
            location: { lat: point.lat, lng: point.lng },
            stopover: false
          }))
        }, (result, status) => {
          if (status === 'OK') directionsRenderer.setDirections(result);
        });

        mapStateRef.current = { map, directionsRenderer, driverMarker, restaurantMarker, customerMarker };
        setIsReady(true);
      })
      .catch(() => setIsReady(false));

    return () => {
      isMounted = false;
    };
  }, [tracking.customerLocation, tracking.restaurantLocation, tracking.route, tracking.driverLocation]);

  useEffect(() => {
    if (!isReady || !tracking.driverLocation || !mapStateRef.current.driverMarker) return;
    mapStateRef.current.driverMarker.setPosition({
      lat: tracking.driverLocation.lat,
      lng: tracking.driverLocation.lng
    });
  }, [isReady, tracking.driverLocation]);

  return <div ref={mapRef} className={styles.googleMapCanvas} />;
};

const DeliveryTracker = ({ orderId, initialTracking, onTrackingUpdate }) => {
  const [tracking, setTracking] = useState(initialTracking || null);
  const [error, setError] = useState('');

  useEffect(() => {
    setTracking(initialTracking || null);
  }, [initialTracking]);

  useEffect(() => {
    if (!orderId) return undefined;

    let isMounted = true;
    const loadTracking = async () => {
      try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/tracking`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load tracking');
        if (isMounted) {
          setTracking(data);
          setError('');
          onTrackingUpdate?.(data);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load tracking');
      }
    };

    loadTracking();
    const intervalId = window.setInterval(loadTracking, 5000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [orderId, onTrackingUpdate]);

  const progressRoute = useMemo(
    () => getProgressRoute(tracking?.route, tracking?.driverLocation, tracking?.progress),
    [tracking]
  );

  if (!tracking) {
    return (
      <section className={styles.tracker}>
        <div className={styles.loadingState}>Loading live tracking...</div>
      </section>
    );
  }

  const activeStep = getActiveStep(tracking.status);
  const etaLabel = tracking.etaMinutes <= 0 ? 'Arriving now' : `${tracking.etaMinutes} min`;
  const driver = tracking.driver || {};
  const restaurant = tracking.restaurantLocation || {};
  const customer = tracking.customerLocation || {};
  const driverLocation = tracking.driverLocation || restaurant;
  const canUseGoogleMap = Boolean(GOOGLE_MAPS_KEY && tracking.restaurantLocation && tracking.customerLocation);

  return (
    <section className={styles.tracker}>
      <div className={styles.trackerHeader}>
        <div>
          <span className={styles.eyebrow}>Live tracking</span>
          <h2>Driver on the way</h2>
        </div>
        <div className={styles.etaPill}>
          <Clock size={18} />
          <span>{etaLabel}</span>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.trackingGrid}>
        <div className={styles.mapPane}>
          <div className={styles.mapBadge}>
            <Clock size={16} />
            <span>Arrives by {formatArrivalTime(tracking.arrivingAt)}</span>
          </div>

          {canUseGoogleMap ? (
            <GoogleDeliveryMap tracking={tracking} />
          ) : (
            <>
              <svg className={styles.mapSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className={styles.roadWide} d="M6 28 C25 18 35 28 50 20 S78 12 94 22" />
                <path className={styles.road} d="M8 86 C18 70 31 71 43 58 S69 44 92 52" />
                <path className={styles.road} d="M12 12 C22 34 32 40 48 42 S72 48 89 78" />
                <polyline className={styles.routeBase} points={getRouteString(tracking.route)} />
                <polyline className={styles.routeDone} points={getRouteString(progressRoute)} />
              </svg>

              <span
                className={`${styles.pin} ${styles.restaurantPin}`}
                style={{ left: `${restaurant.x}%`, top: `${restaurant.y}%` }}
                title={restaurant.label}
              >
                <Store size={18} />
              </span>
              <span
                className={`${styles.pin} ${styles.homePin}`}
                style={{ left: `${customer.x}%`, top: `${customer.y}%` }}
                title={customer.label}
              >
                <Home size={18} />
              </span>
              <span
                className={styles.driverPin}
                style={{ left: `${driverLocation.x}%`, top: `${driverLocation.y}%` }}
                title="Driver location"
              >
                <Navigation size={18} />
              </span>
            </>
          )}

          <div className={styles.mapLegend}>
            <span><Store size={14} /> Kitchen</span>
            <span><Navigation size={14} /> Driver</span>
            <span><Home size={14} /> You</span>
          </div>
        </div>

        <aside className={styles.infoPane}>
          <div className={styles.driverRow}>
            <div className={styles.driverAvatar}>{getInitials(driver.name)}</div>
            <div>
              <h3>{driver.name}</h3>
              <p><Truck size={15} /> {driver.vehicleNumber}</p>
            </div>
          </div>

          <div className={styles.driverMeta}>
            <span><Star size={15} /> {driver.rating}</span>
            <span><Phone size={15} /> {driver.phone}</span>
          </div>

          <div className={styles.progressBlock}>
            <div className={styles.progressTop}>
              <span>{tracking.status}</span>
              <strong>{tracking.progressPercent}%</strong>
            </div>
            <div className={styles.progressTrack}>
              <span style={{ width: `${tracking.progressPercent}%` }} />
            </div>
          </div>

          <div className={styles.statusList}>
            {STATUS_STEPS.map((step, index) => (
              <div
                key={step}
                className={`${styles.statusItem} ${index <= activeStep ? styles.statusActive : ''}`}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <div className={styles.locationBox}>
            <MapPin size={18} />
            <span>{driverLocation.label || 'Driver location updated just now'}</span>
          </div>

          {tracking.maps?.directionsUrl && (
            <a
              className={styles.mapsLink}
              href={tracking.maps.directionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              Open Google Maps
            </a>
          )}
        </aside>
      </div>
    </section>
  );
};

export default DeliveryTracker;
