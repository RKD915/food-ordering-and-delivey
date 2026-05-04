import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import Food from './models/Food.js';
import User from './models/User.js';
import Order from './models/Order.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const indianFoods = [
  { name: 'Adhirasam', price: 90, category: 'Dessert', desc: 'Delicious sweet from Tamil Nadu.', img: 'adhirasam' },
  { name: 'Aloo Gobi', price: 150, category: 'Main Course', desc: 'Vegetarian dish made with potatoes, cauliflower, and Indian spices.', img: 'aloo_gobi' },
  { name: 'Aloo Matar', price: 140, category: 'Main Course', desc: 'Punjabi dish consisting of potatoes and peas in a spiced tomato sauce.', img: 'aloo_matar' },
  { name: 'Aloo Methi', price: 130, category: 'Main Course', desc: 'Potatoes and fresh fenugreek leaves.', img: 'aloo_methi' },
  { name: 'Aloo Tikki', price: 60, category: 'Snack', desc: 'North Indian snack made of boiled potatoes, peas, and various curry spices.', img: 'aloo_tikki' },
  { name: 'Anarsa', price: 100, category: 'Dessert', desc: 'Pastry-like snack commonly associated with Diwali in Maharashtra.', img: 'anarsa' },
  { name: 'Ariselu', price: 110, category: 'Dessert', desc: 'Traditional sweet of Andhra Pradesh, Telangana and Odisha.', img: 'ariselu' },
  { name: 'Bandar Laddu', price: 120, category: 'Dessert', desc: 'Sweet originating from Machilipatnam, Andhra Pradesh.', img: 'bandar_laddu' },
  { name: 'Basundi', price: 160, category: 'Dessert', desc: 'Sweetened dense milk made by boiling milk on low heat.', img: 'basundi' },
  { name: 'Bhatura', price: 80, category: 'Bread', desc: 'Fluffy deep-fried leavened sourdough bread.', img: 'bhatura' },
  { name: 'Bhindi Masala', price: 170, category: 'Main Course', desc: 'Stir fried okra that is slit and stuffed with spice mix.', img: 'bhindi_masala' },
  { name: 'Biryani', price: 280, category: 'Main Course', desc: 'Aromatic basmati rice cooked with spices.', img: 'biryani' },
  { name: 'Butter Chicken', price: 350, category: 'Curry', desc: 'Chicken simmered in a rich tomato and butter gravy.', img: 'butter_chicken' },
  { name: 'Boondi', price: 70, category: 'Snack', desc: 'Sweet or savory snack made from fried chickpea flour.', img: 'boondi' }
];

const westernFoods = [
  { name: 'Baked Potato', price: 120, category: 'Sides', desc: 'Oven-baked potato served with butter and herbs.', img: 'Baked Potato' },
  { name: 'Burger', price: 199, category: 'Fast Food', desc: 'Juicy beef patty with melted cheese, lettuce, and tomato.', img: 'Burger' },
  { name: 'Crispy Chicken', price: 249, category: 'Fast Food', desc: 'Golden-fried crispy chicken wings/pieces.', img: 'Crispy Chicken' },
  { name: 'Donut', price: 80, category: 'Dessert', desc: 'Sweet dough fried and glazed.', img: 'Donut' },
  { name: 'Fries', price: 99, category: 'Sides', desc: 'Crispy golden French fries.', img: 'Fries' },
  { name: 'Hot Dog', price: 149, category: 'Fast Food', desc: 'Classic Hot Dog with ketchup and mustard.', img: 'Hot Dog' },
  { name: 'Pizza', price: 399, category: 'Italian', desc: 'Fresh mozzarella, tomato sauce, and basil on a crispy crust.', img: 'Pizza' },
  { name: 'Sandwich', price: 139, category: 'Fast Food', desc: 'Fresh veggies and meats layered between artisan bread.', img: 'Sandwich' },
  { name: 'Taco', price: 179, category: 'Mexican', desc: 'Soft corn tortillas with seasoned fillings.', img: 'Taco' },
  { name: 'Taquito', price: 169, category: 'Mexican', desc: 'Rolled-up tortilla bursting with savory filling.', img: 'Taquito' }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for custom seeding...');

    await Food.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data.');

    // Setup public directories for high-def image transfer
    const publicIndian = 'd:/food ordering and delivey/public/images/indian';
    const publicWestern = 'd:/food ordering and delivey/public/images/western';
    if (!fs.existsSync(publicIndian)) fs.mkdirSync(publicIndian, { recursive: true });
    if (!fs.existsSync(publicWestern)) fs.mkdirSync(publicWestern, { recursive: true });

    function copyRandomImage(sourceDir, destDir, destName) {
        if (!fs.existsSync(sourceDir)) { console.log('not exists', sourceDir); return null; }
        const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp'));
        if (files.length > 0) {
            const ext = path.extname(files[0]);
            fs.copyFileSync(path.join(sourceDir, files[0]), path.join(destDir, destName + ext));
            return ext;
        }
        return null;
    }

    const foodsToInsert = [];

    const indianSource = 'd:/food ordering and delivey/Dataset/indian food data/Indian Food Images/Indian Food Images/';
    indianFoods.forEach(item => {
      const ext = copyRandomImage(indianSource + item.img, publicIndian, item.img);
      if (ext) {
        foodsToInsert.push({...item, region: 'Indian', imageUrl: `/images/indian/${item.img}${ext}`});
      }
    });

    const westernSource = 'd:/food ordering and delivey/Dataset/western food data/Fast Food Classification V2/Train/';
    westernFoods.forEach(item => {
      const ext = copyRandomImage(westernSource + item.img, publicWestern, item.img);
      if (ext) {
        foodsToInsert.push({...item, region: 'Western', imageUrl: `/images/western/${item.img}${ext}`});
      }
    });

    await Food.insertMany(foodsToInsert);
    console.log(`Successfully inserted ${foodsToInsert.length} High-Definition Custom Dataset Items!`);

    // Seed User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);
    
    const specificUser = new User({
      name: 'Rohan Kumar',
      email: 'rohan@test.com',
      password: hashedPassword
    });
    
    await specificUser.save();
    console.log('Test user created: email: rohan@test.com, password: 123');

    console.log('Database seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
