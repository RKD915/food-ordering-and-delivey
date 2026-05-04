import mongoose from 'mongoose';

const mapPointSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

const driverSchema = new mongoose.Schema({
  name: { type: String, default: 'Aman Verma' },
  phone: { type: String, default: '+91 98765 43210' },
  vehicleNumber: { type: String, default: 'KA 05 FE 2026' },
  rating: { type: Number, default: 4.8 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
      quantity: { type: Number, required: true, default: 1 }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: 'COD' },
  payment: {
    method: { type: String, default: 'COD' },
    provider: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    transactionId: { type: String, default: '' },
    upiId: { type: String, default: '' },
    merchantUpiId: { type: String, default: '' },
    bankName: { type: String, default: '' },
    cardType: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    walletMobile: { type: String, default: '' }
  },
  delivery: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    instructions: { type: String, default: '' },
    location: { type: mapPointSchema }
  },
  tracking: {
    routeId: { type: String, default: '' },
    driver: { type: driverSchema, default: () => ({}) },
    restaurantLocation: { type: mapPointSchema },
    customerLocation: { type: mapPointSchema },
    route: { type: [mapPointSchema], default: [] },
    startedAt: { type: Date },
    estimatedDeliveryAt: { type: Date },
    etaMinutes: { type: Number, default: 30 },
    distanceKm: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
