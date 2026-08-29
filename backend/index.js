import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/adminUser.routes.js';
import blogRoutes from './routes/blog.routes.js';
import productRoutes from './routes/product.routes.js';
import reviewRoutes from './routes/review.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import voucherRoutes from './routes/voucher.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import healthRoutes from './routes/health.routes.js';

import { setSecurityHeaders } from './middlewares/securityHeaders.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInputs } from './middlewares/sanitizer.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { placeStripeOrder } from './controllers/order.controllers.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.use(setSecurityHeaders);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
}));

app.post("/api/orders/webhook", express.raw({ type: "application/json" }), placeStripeOrder);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(sanitizeInputs);
app.use(apiRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/user/auth", authRateLimiter, userRoutes);
app.use("/api/admin/auth", authRateLimiter, adminRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/products", productRoutes);
app.use("/api/:productId/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/saas-ecommerce";

mongoose.connect(MONGO_URI).then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log("Server is running on port", PORT));
}).catch(err => {
    console.error("MongoDB connection error:", err);
});
