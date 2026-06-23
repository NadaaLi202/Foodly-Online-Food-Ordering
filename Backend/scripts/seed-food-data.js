/**
 * Seed script for Foodly food products.
 * Adjust the import paths/model name below to match your project structure.
 *
 * Usage:
 *   node Backend/scripts/seed-food-data.js
 * or add to package.json:
 *   "scripts": { "seed": "node Backend/scripts/seed-food-data.js" }
 */

import "dotenv/config";
import mongoose from "mongoose";



// Adjust this path to match where your Product model actually lives
import Product from "../src/modules/product/product.model.js";
import User from "../src/modules/user/user.model.js";

const demoUsers = [
  {
    name: "Admin User",
    email: "admin@foodly.test",
    password: "Admin12345",
    role: "admin",
  },
  {
    name: "Customer User",
    email: "customer@foodly.test",
    password: "Customer12345",
    role: "customer",
  },
];

const products = [
  // ---------- PIZZA ----------
  {
    name: "Margherita Pizza",
    description: "Classic pizza with fresh tomato sauce, mozzarella, and basil leaves.",
    price: 8.99,
    category: "Pizza",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
  },
  {
    name: "Pepperoni Pizza",
    description: "Loaded with spicy pepperoni slices and melted mozzarella cheese.",
    price: 10.49,
    category: "Pizza",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
  },
  {
    name: "BBQ Chicken Pizza",
    description: "Grilled chicken, red onions, and BBQ sauce on a crispy crust.",
    price: 11.99,
    category: "Pizza",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80",
  },

  // ---------- BURGER ----------
  {
    name: "Classic Beef Burger",
    description: "Juicy beef patty with lettuce, tomato, cheese, and house sauce.",
    price: 7.49,
    category: "Burger",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
  {
    name: "Double Cheeseburger",
    description: "Two beef patties stacked with double cheddar cheese and pickles.",
    price: 9.99,
    category: "Burger",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
  },
  {
    name: "Crispy Chicken Burger",
    description: "Crispy fried chicken fillet with mayo and fresh lettuce.",
    price: 8.49,
    category: "Burger",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80",
  },

  // ---------- PASTA ----------
  {
    name: "Spaghetti Bolognese",
    description: "Traditional spaghetti tossed in a rich beef and tomato ragu.",
    price: 9.49,
    category: "Pasta",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600&q=80",
  },
  {
    name: "Creamy Alfredo Pasta",
    description: "Fettuccine pasta in a creamy parmesan and garlic sauce.",
    price: 10.99,
    category: "Pasta",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80",
  },

  // ---------- DRINKS ----------
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice, no added sugar.",
    price: 3.49,
    category: "Drinks",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80",
  },
  {
    name: "Iced Lemon Mint",
    description: "Refreshing iced drink with lemon, mint, and a touch of sugar syrup.",
    price: 2.99,
    category: "Drinks",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
  },

  // ---------- DESSERTS ----------
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with a molten chocolate center.",
    price: 5.99,
    category: "Desserts",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80",
  },
  {
    name: "New York Cheesecake",
    description: "Creamy classic cheesecake with a buttery biscuit base.",
    price: 6.49,
    category: "Desserts",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600&q=80",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    console.log("Old products removed");

    await Product.insertMany(products);
    console.log(`${products.length} products inserted successfully`);

    for (const user of demoUsers) {
      await User.findOneAndUpdate(
        { email: user.email },
        user,
        { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true },
      );
    }
    console.log(`${demoUsers.length} demo users ensured successfully`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();
