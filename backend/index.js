import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'

// voucher
// import Voucher from './models/voucher.model.js'

// routes
import userRoutes from './routes/user.routes.js'
import adminRoutes from './routes/adminUser.routes.js'
import blogRoutes from './routes/blog.routes.js'
import productRoutes from './routes/product.routes.js'
import reviewRoutes from './routes/review.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js'
import orderRoutes from './routes/order.routes.js'


dotenv.config();

const app = express();

app.use(cors())

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))



// routes
// sample voucher codes
// app.use("", async (req, res) => {
//     const voucher = {
//         code: "jkl",
//         discountType: "flat",
//         discountValue: 10,
//         expiryDate: new Date("2025-12-31"),
//         usageLimit: 10,
//     }

//     const newVoucher = new Voucher(voucher)
//     await newVoucher.save()
//     console.log('voucher saved')

// })

app.use("/api/user/auth", userRoutes)
app.use("/api/admin/auth", adminRoutes)
app.use("/api/blogs", blogRoutes)
app.use("/api/products", productRoutes)
app.use("/api/:productId/reviews", reviewRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/orders", orderRoutes)



let PORT = process.env.PORT || 3000
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log("Server is running on ", PORT));
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

