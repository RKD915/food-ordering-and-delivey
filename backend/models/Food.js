import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  region: { type: String, required: true }, // 'Indian' or 'Western'
  imageUrl: { type: String }
}, { timestamps: true });

export default mongoose.model('Food', foodSchema);
