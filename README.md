# Foodly - Full Stack Food Ordering Prototype

Foodly is a hiring-assessment prototype for online food ordering. It includes a React/Vite customer app, an admin dashboard, Arabic/English localization with RTL support, and a Node/Express/MongoDB API.

## Stack

- Frontend: React, Vite, React Router, Axios, Context API, React i18next, Tailwind CSS, React Hook Form, React Toastify
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer, MVC-style modules

## Features

- Customer registration, login, logout, protected routes, and role-based admin access
- Menu with search, category filters, details page, availability status, and cart actions
- LocalStorage cart with add, remove, quantity changes, subtotal, delivery, and total
- Checkout with delivery details and cash or mocked online payment
- Customer orders and order tracking timeline
- Admin dashboard stats: total orders, products, users, and revenue
- Admin product CRUD with URL or uploaded images
- Admin order status updates
- Admin user role updates and deletion
- English and Arabic UI with saved language preference and RTL direction

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure backend env:

```bash
cp Backend/.env.example Backend/.env
```

Set `MONGO_URI` and `JWT_SECRET` in `Backend/.env`.

3. Configure frontend env:

```bash
cp Frontend/.env.example Frontend/.env
```

4. Seed demo data:

```bash
npm run seed
```

Demo accounts created by the seed script:

- Admin: `admin@foodly.test` / `Admin12345`
- Customer: `customer@foodly.test` / `Customer12345`

5. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/users`
- `DELETE /api/users/:id`
- `PATCH /api/users/:id/role`
- `GET /api/dashboard/stats`

Admin-only endpoints require a bearer token from an admin login.

## Project Structure

- `Backend/index.js` - Express app entry point
- `Backend/src/modules/auth` - authentication controller/routes
- `Backend/src/modules/product` - product model/service/controller/routes
- `Backend/src/modules/order` - order model/service/controller/routes
- `Backend/src/modules/user` - user management model/controller/routes
- `Backend/src/modules/dashboard` - admin statistics
- `Backend/src/middleware` - auth, upload, validation/error middleware
- `Backend/scripts/seed-food-data.js` - demo users and products
- `Frontend/src/pages` - customer, auth, and admin pages
- `Frontend/src/components/food` - reusable layout, cards, forms, states, timeline
- `Frontend/src/contexts` - auth and cart state
- `Frontend/src/locales` - English and Arabic translations

Online payment is intentionally mocked and does not call a payment gateway.
