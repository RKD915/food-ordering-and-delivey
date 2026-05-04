# FoodExpress

FoodExpress is a food ordering and delivery web app built with React, Vite, Express, MongoDB, and Mongoose. It supports menu browsing, cart checkout, multiple payment methods, order history, and live delivery tracking with per-order route and ETA data.

## Features

- Browse Indian and Western food menus from MongoDB.
- Add items to cart with live cart count.
- Checkout with delivery details.
- Use UPI, credit/debit card, wallet, net banking, or cash on delivery.
- Save orders in MongoDB.
- Show order confirmation, receipt, and order history.
- Track each order with route, driver, ETA, progress, and Google Maps directions support.

## Tech Stack

- Frontend: React, Vite, React Router
- Icons: lucide-react
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs

## Project Structure

```text
food ordering and delivey/
|-- backend/
|   |-- models/
|   |   |-- Food.js
|   |   |-- Order.js
|   |   `-- User.js
|   |-- .env
|   |-- seed.js
|   |-- seedCustomData.js
|   `-- server.js
|-- frontend/
|   |-- public/
|   |   `-- images/
|   |-- src/
|   |   |-- components/
|   |   |-- config/
|   |   |-- pages/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
|-- netlify.toml
|-- render.yaml
|-- vercel.json
`-- README.md
```

## Environment Variables

Backend file: `backend/.env`

```env
MONGO_URI=mongodb://localhost:27017/food-delivery-db
PORT=5000
JWT_SECRET=supersecretfoodappkey
```

Frontend file: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=
```

For deployment, set `VITE_API_BASE_URL` to your Render backend URL:

```env
VITE_API_BASE_URL=https://food-ordering-and-delivey.onrender.com/api
```

`VITE_GOOGLE_MAPS_API_KEY` is optional. If it is empty, the fallback delivery tracker still works.

## Install Dependencies

Frontend:

```powershell
cd "D:\food ordering and delivey\frontend"
npm install
```

Backend:

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
cd "D:\food ordering and delivey\frontend"
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Useful Scripts

Frontend scripts, run inside `frontend/`:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Backend scripts, run inside `backend/`:

```powershell
npm start
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

## Deployment

Recommended deployment:

- Backend: Render web service
- Frontend: Netlify or Vercel static site
- Database: MongoDB Atlas

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
https://foodexpresssss.netlify.app/

```text
Base/root directory: frontend
Build command: npm run build
Publish/output directory: dist
Environment variables:
  VITE_API_BASE_URL=https://food-ordering-and-delivey.onrender.com/api
  VITE_GOOGLE_MAPS_API_KEY=<optional Google Maps API key>
```

## Notes

- Orders are stored in MongoDB database `food-delivery-db`.
- The cart is stored in `localStorage`.
- Payment validation is mock/demo only. Use a real payment gateway such as Razorpay, Stripe, Cashfree, or PayU for production.
- True Zomato-style live GPS tracking needs a driver app sending real GPS coordinates to the backend.
