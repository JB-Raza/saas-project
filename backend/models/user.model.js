import mongoose from 'mongoose'

const Schema = mongoose.Schema

const addressSchema = new Schema({
    street: { type: String, required: true },
    apartment: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    zipCode: { type: String, required: true },
    country: { type: String, default: "Pakistan" },
    phone: { type: String, default: "" },
    isDefault: { type: Boolean, default: false }
})

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",
    },
    addresses: [addressSchema],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        default: [],
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true
})

const User = mongoose.model("user", userSchema)
export default User
