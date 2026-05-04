# FoodExpress

FoodExpress is a food ordering and delivery web app built with React, Vite, Express, MongoDB, and Mongoose. It supports menu browsing, cart checkout, multiple payment methods, order history, and live delivery tracking with per-order route and ETA data.

## Features

- Browse Indian and Western food menus from MongoDB.
- Add items to cart with live cart count.
- Checkout with delivery details.
- Payment methods:
  - UPI with app-specific merchant IDs.
  - Credit and debit card details.
  - Digital wallet.
  - Net banking.
  - Cash on delivery.
- Save orders in MongoDB.
- Show order confirmation, receipt, and order history.
- Track each order with unique route, driver, ETA, progress, and Google Maps directions link.
- Optional Google Maps frontend integration using `VITE_GOOGLE_MAPS_API_KEY`.

## Tech Stack

- Frontend: React, Vite, React Router
- Icons: lucide-react
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs

## Project Structure

```text
food ordering and delivey/
├── backend/
│   ├── models/
│   │   ├── Food.js
│   │   ├── Order.js
│   │   └── User.js
│   ├── .env
│   ├── seed.js
│   ├── seedCustomData.js
│   └── server.js
├── public/
│   └── images/
├── src/
│   ├── components/
│   │   ├── DeliveryTracker.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Cart.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── OrderConfirmed.jsx
│   │   ├── PurchaseHistory.jsx
│   │   └── Register.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js
- npm
- MongoDB running locally
- MongoDB Compass is optional, but useful for viewing `food-delivery-db`

## Environment Variables

Backend environment file: `backend/.env`

```env
MONGO_URI=mongodb://localhost:27017/food-delivery-db
PORT=5000
JWT_SECRET=supersecretfoodappkey
```

Frontend environment file: `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=
```

Add a real Google Maps API key to enable the Google Maps map view. Without a key, the fallback animated tracker still works.

For deployment, set `VITE_API_BASE_URL` to your deployed backend URL, for example:

```env
VITE_API_BASE_URL=https://foodexpress-api.onrender.com/api
```

## Install Dependencies

From the project root:

```powershell
npm install
```

From the backend folder:

```powershell
cd "D:\food ordering and delivey\backend"
npm install
```

## Run The Project

Open two terminals.

Terminal 1, backend:

```powershell
cd "D:\food ordering and delivey\backend"
npm start
```

Backend URL:

```text
http://localhost:5000
```

Terminal 2, frontend:

```powershell
cd "D:\food ordering and delivey"
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Seed Database

Use this only when you want to reset and reinsert sample foods/users/orders:

```powershell
cd "D:\food ordering and delivey\backend"
node seedCustomData.js
```

Seeded test user:

```text
Email: rohan@test.com
Password: 123
```

## Useful Scripts

Frontend:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```powershell
npm start
```

## API Endpoints

```text
GET    /                         API health check
POST   /api/register             Register user
POST   /api/login                Login user
GET    /api/foods                Fetch menu items
POST   /api/orders               Create order
GET    /api/orders               Fetch orders
GET    /api/orders/:id           Fetch one order
GET    /api/orders/:id/tracking  Fetch live tracking snapshot
```

## Payment Flow

This project uses mock payment validation for demo purposes. It validates input and stores only safe metadata:

- UPI stores provider, customer UPI ID, and merchant UPI ID.
- Card stores card type and last 4 digits only.
- Wallet stores provider and mobile number.
- Net banking stores selected bank name.
- Cash on delivery stores pending collection status.

Do not use this as a production payment gateway without integrating a real provider such as Razorpay, Stripe, Cashfree, or PayU.

## Delivery Tracking

Each order gets:

- Unique route ID.
- Driver details.
- Restaurant location.
- Customer destination.
- Route points.
- ETA and progress.
- Google Maps directions URL.

The live map updates by polling:

```text
GET /api/orders/:id/tracking
```

For true Zomato-style tracking in production, a driver app must send real GPS coordinates to the backend, and the frontend should subscribe through WebSockets or server-sent events.

## Notes

- The cart is stored in `localStorage`.
- Orders are stored in MongoDB database `food-delivery-db`.
- The fallback tracker works without Google Maps.
- Google Maps requires a valid browser API key and enabled Maps JavaScript API.

## Deployment

Recommended deployment:

- Backend: Render web service
- Frontend: Netlify or Vercel static site
- Database: MongoDB Atlas

Important: the local MongoDB URL `mongodb://localhost:27017/food-delivery-db` will not work after deployment because the deployed backend runs on another server. Use a MongoDB Atlas connection string for `MONGO_URI`.

Backend on Render:

```text
Root directory: backend
Build command: npm install
Start command: npm start
Environment variables:
  MONGO_URI=<your MongoDB Atlas URI>
  JWT_SECRET=<long random secret>
```

Frontend on Netlify or Vercel:

```text
Build command: npm run build
Publish/output directory: dist
Environment variables:
  VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api
  VITE_GOOGLE_MAPS_API_KEY=<optional Google Maps API key>
```
