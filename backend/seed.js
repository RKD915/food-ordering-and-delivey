import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Food from './models/Food.js';
import Order from './models/Order.js';

dotenv.config();

const dummyFoods = [
  {
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with melted cheese, lettuce, and tomato.',
    price: 12.99,
    category: 'Burger',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800'
  },
  {
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomato sauce, and basil on a crispy crust.',
    price: 15.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?auto=format&fit=crop&w=800'
  },
  {
    name: 'Spicy Sushi Roll',
    description: 'Fresh tuna with spicy mayo, avocado, and cucumber.',
    price: 18.99,
    category: 'Sushi',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800'
  },
  {
    name: 'Chicken Tacos',
    description: 'Soft corn tortillas with seasoned chicken, salsa, and cilantro.',
    price: 11.99,
    category: 'Mexican',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Food.deleteMany({});
    await Order.deleteMany({});
    console.log('Existing data cleared.');

    // Seed Foods
    await Food.insertMany(dummyFoods);
    console.log('Dummy foods inserted.');

    // Seed User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const testUser = new User({
      name: 'Test User',
      email: 'test@user.com',
      password: hashedPassword
    });
    
    await testUser.save();
    console.log('Test user created: email: test@user.com, password: password123');

    console.log('Database seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
