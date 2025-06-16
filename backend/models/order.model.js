import mongoose from 'mongoose'


const voucherSchema = new mongoose.Schema({
    code: { type: String },
    discountType: { type: String, enum: ["flat", "percentage"], default: "percentage" },
    discountValue: { type: Number },
}, { _id: false })

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

    items: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            title: { type: String, required: true },
            quantity: { type: Number, required: true },
            variant: {
                image: { type: String, required: true },
                color: { type: String, required: true },
                size: { type: String },
            },
            price: { type: Number, required: true },
            discount: { type: Number, default: 0 },
            totalPriceAfterDiscount: { type: Number, required: true },
        }
    ],

    totalPrice: { type: Number, required: true },

    paymentMethod: { type: String, enum: ["cashOnDelivery", "paypal", "stripe"], required: true },
    paymentStatus: {
        type: String,
        default: "unpaid"
    },
    orderStatus: {
        type: String,
        enum: ["pending", "processing", "on-the-way", "delivered", "cancelled"],
        default: "pending"
    },

    deliveryInfo: {
        address: { type: String, required: true },
        apartment: { type: String, default: "" },
        city: { type: String, required: true },
        phone: { type: String, required: true },
    },
    trackingNumber: { type: String, required: true },

    voucher: voucherSchema,

    comment: { type: String },
}, { timestamps: true });


const Order = mongoose.model("order", orderSchema)

export default Order
