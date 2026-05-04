import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from './models/User.js';
import Food from './models/Food.js';
import Order from './models/Order.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DRIVER_POOL = [
  { name: 'Aman Verma', phone: '+91 98765 43210', vehicleNumber: 'KA 05 FE 2026', rating: 4.8 },
  { name: 'Nikhil Rao', phone: '+91 99887 77665', vehicleNumber: 'MH 12 FD 4242', rating: 4.9 },
  { name: 'Sahil Khan', phone: '+91 91234 56780', vehicleNumber: 'DL 03 FX 1818', rating: 4.7 }
];

const RESTAURANT_LOCATION = {
  label: 'FoodExpress Kitchen',
  lat: 12.9716,
  lng: 77.5946,
  x: 15,
  y: 72
};

const DELIVERY_ZONES = [
  { label: 'Indiranagar', lat: 12.9784, lng: 77.6408, x: 86, y: 26 },
  { label: 'Koramangala', lat: 12.9352, lng: 77.6245, x: 82, y: 34 },
  { label: 'Jayanagar', lat: 12.9250, lng: 77.5938, x: 76, y: 46 },
  { label: 'Whitefield', lat: 12.9698, lng: 77.7500, x: 90, y: 18 },
  { label: 'Malleshwaram', lat: 13.0031, lng: 77.5643, x: 68, y: 22 },
  { label: 'HSR Layout', lat: 12.9116, lng: 77.6474, x: 86, y: 42 }
];

const ROUTE_LABELS = [
  'Kitchen Road',
  'Main Signal',
  'Market Junction',
  'Flyover',
  'Service Lane',
  'Last Mile'
];

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const hashString = (value = '') => (
  value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const seededOffset = (seed, salt, scale) => {
  const value = Math.sin((seed + 1) * (salt + 3) * 12.9898) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * scale;
};

const createCustomerLocation = (address, seed) => {
  const zone = DELIVERY_ZONES[Math.abs(seed) % DELIVERY_ZONES.length];
  return {
    label: address || zone.label,
    lat: Number((zone.lat + seededOffset(seed, 1, 0.014)).toFixed(6)),
    lng: Number((zone.lng + seededOffset(seed, 2, 0.014)).toFixed(6)),
    x: Number(clamp(zone.x + seededOffset(seed, 3, 10), 64, 91).toFixed(2)),
    y: Number(clamp(zone.y + seededOffset(seed, 4, 12), 16, 52).toFixed(2))
  };
};

const createPersonalizedRoute = (origin, destination, seed) => {
  const route = [origin];
  const segmentCount = 5;
  const dx = destination.x - origin.x;
  const dy = destination.y - origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;

  for (let index = 1; index < segmentCount; index += 1) {
    const ratio = index / segmentCount;
    const bend = seededOffset(seed, index + 10, 18);
    const latBend = seededOffset(seed, index + 20, 0.006);
    const lngBend = seededOffset(seed, index + 30, 0.006);
    route.push({
      label: ROUTE_LABELS[(seed + index) % ROUTE_LABELS.length],
      lat: Number((origin.lat + (destination.lat - origin.lat) * ratio + latBend).toFixed(6)),
      lng: Number((origin.lng + (destination.lng - origin.lng) * ratio + lngBend).toFixed(6)),
      x: Number(clamp(origin.x + dx * ratio + normalX * bend, 8, 92).toFixed(2)),
      y: Number(clamp(origin.y + dy * ratio + normalY * bend, 12, 88).toFixed(2))
    });
  }

  route.push(destination);
  return route;
};

const getDistanceKm = (origin, destination) => {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Number((earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

const createGoogleMapsUrl = (origin, destination, route = []) => {
  const waypoints = route.slice(1, -1).map((point) => `${point.lat},${point.lng}`).join('|');
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'driving'
  });
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const interpolateRoute = (route, progress) => {
  if (!Array.isArray(route) || route.length === 0) return RESTAURANT_LOCATION;
  if (route.length === 1) return route[0];

  const segmentCount = route.length - 1;
  const scaledProgress = clamp(progress, 0, 1) * segmentCount;
  const index = Math.min(segmentCount - 1, Math.floor(scaledProgress));
  const segmentProgress = scaledProgress - index;
  const start = route[index];
  const end = route[index + 1];

  return {
    label: progress >= 0.9 ? end.label : start.label,
    lat: Number((start.lat + (end.lat - start.lat) * segmentProgress).toFixed(6)),
    lng: Number((start.lng + (end.lng - start.lng) * segmentProgress).toFixed(6)),
    x: Number((start.x + (end.x - start.x) * segmentProgress).toFixed(2)),
    y: Number((start.y + (end.y - start.y) * segmentProgress).toFixed(2))
  };
};

const createTransactionId = (method = 'COD') => {
  const safeMethod = method.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'PAY';
  return `${safeMethod}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

const createTrackingPlan = ({ address = '', totalAmount = 0, items = [] }) => {
  const seed = hashString(`${address}-${totalAmount}-${items.length}`);
  const customerLocation = createCustomerLocation(address, seed);
  const route = createPersonalizedRoute(RESTAURANT_LOCATION, customerLocation, seed);
  const distanceKm = getDistanceKm(RESTAURANT_LOCATION, customerLocation);
  const etaMinutes = clamp(Math.round(18 + distanceKm * 3 + items.length * 3 + (seed % 8)), 24, 55);
  const driver = DRIVER_POOL[seed % DRIVER_POOL.length];
  const startedAt = new Date(Date.now() - 4 * 60 * 1000);
  const estimatedDeliveryAt = new Date(startedAt.getTime() + etaMinutes * 60 * 1000);

  return {
    routeId: `RTE-${seed.toString(36).toUpperCase()}`,
    driver,
    restaurantLocation: RESTAURANT_LOCATION,
    customerLocation,
    route,
    startedAt,
    estimatedDeliveryAt,
    etaMinutes,
    distanceKm
  };
};

const getProgressStatus = (progress) => {
  if (progress >= 1) return 'Delivered';
  if (progress >= 0.82) return 'Arriving';
  if (progress >= 0.34) return 'Out for delivery';
  if (progress >= 0.14) return 'Preparing';
  return 'Placed';
};

const buildTrackingSnapshot = (order) => {
  const tracking = order.tracking || {};
  const generatedPlan = createTrackingPlan({
    address: order.delivery?.address || '',
    totalAmount: order.totalAmount,
    items: order.items || []
  });
  const plan = tracking.routeId ? tracking : {
    ...generatedPlan,
    startedAt: tracking.startedAt || generatedPlan.startedAt,
    estimatedDeliveryAt: tracking.estimatedDeliveryAt || generatedPlan.estimatedDeliveryAt,
    driver: tracking.driver || generatedPlan.driver
  };
  const route = plan.route?.length ? plan.route : createPersonalizedRoute(
    RESTAURANT_LOCATION,
    createCustomerLocation(order.delivery?.address || '', hashString(order._id.toString())),
    hashString(order._id.toString())
  );
  const start = tracking.startedAt ? new Date(tracking.startedAt).getTime() : order.createdAt.getTime();
  const eta = tracking.estimatedDeliveryAt
    ? new Date(tracking.estimatedDeliveryAt).getTime()
    : start + 30 * 60 * 1000;
  const now = Date.now();
  const rawProgress = (now - start) / Math.max(1, eta - start);
  const progress = clamp(Math.max(0.06, rawProgress), 0, 1);
  const driverLocation = interpolateRoute(route, progress);
  const etaMinutes = Math.max(0, Math.ceil((eta - now) / 60000));

  return {
    orderId: order._id,
    status: getProgressStatus(progress),
    progress,
    progressPercent: Math.round(progress * 100),
    etaMinutes,
    arrivingAt: new Date(eta).toISOString(),
    serverTime: new Date(now).toISOString(),
    routeId: plan.routeId,
    distanceKm: plan.distanceKm,
    driver: plan.driver || DRIVER_POOL[0],
    driverLocation,
    restaurantLocation: plan.restaurantLocation || RESTAURANT_LOCATION,
    customerLocation: plan.customerLocation || route[route.length - 1],
    route,
    maps: {
      directionsUrl: createGoogleMapsUrl(
        plan.restaurantLocation || RESTAURANT_LOCATION,
        plan.customerLocation || route[route.length - 1],
        route
      )
    }
  };
};

const serializeOrder = (order) => {
  const plainOrder = order.toObject ? order.toObject() : order;
  return {
    ...plainOrder,
    computedTracking: buildTrackingSnapshot(order)
  };
};

app.get('/', (req, res) => {
  res.send('Food Delivery API is running...');
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items = [], totalAmount = 0, payment = {}, paymentMethod = 'COD', delivery = {} } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const userId = req.body.userId || req.user?.id || new mongoose.Types.ObjectId();
    const method = payment.method || paymentMethod;
    const transactionId = payment.transactionId || createTransactionId(method);
    const paymentStatus = method === 'COD' ? 'Pending collection' : 'Paid';
    const tracking = createTrackingPlan({ address: delivery.address, totalAmount, items });

    const newOrder = new Order({
      user: userId,
      items: items.map((item) => ({
        food: item._id || item.food,
        quantity: item.quantity || 1
      })),
      totalAmount,
      status: 'Placed',
      paymentMethod: method,
      payment: {
        method,
        provider: payment.provider || '',
        status: payment.status || paymentStatus,
        transactionId,
        upiId: payment.upiId || '',
        merchantUpiId: payment.merchantUpiId || '',
        bankName: payment.bankName || '',
        cardType: payment.cardType || '',
        cardLast4: payment.cardLast4 || '',
        walletMobile: payment.walletMobile || ''
      },
      delivery: {
        name: delivery.name || '',
        phone: delivery.phone || '',
        address: delivery.address || '',
        instructions: delivery.instructions || '',
        location: tracking.customerLocation
      },
      tracking
    });

    const savedOrder = await newOrder.save();
    await savedOrder.populate('items.food');

    res.status(201).json({
      message: 'Order created',
      orderId: savedOrder._id,
      order: serializeOrder(savedOrder)
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.food').sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.food');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(serializeOrder(order));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders/:id/tracking', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(buildTrackingSnapshot(order));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
