import mongoose from 'mongoose'

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ["flat", "percentage"], default: "percentage" },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    usageLimit: { type: Number, default: 10 }

}, { timestamps: true })

const Voucher = mongoose.model("voucher", voucherSchema)

export default Voucher