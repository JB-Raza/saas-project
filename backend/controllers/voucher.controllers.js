import Voucher from '../models/voucher.model.js'

export const applyVoucher = async (req, res) => {
    try {
        const { code, cartTotal } = req.body
        const userId = req.user._id

        if (!code || cartTotal === undefined) {
            return res.status(400).json({ success: false, message: "Voucher code and cart total are required" })
        }

        const voucher = await Voucher.findOne({ code: code.toUpperCase().trim() })
        if (!voucher) {
            return res.status(404).json({ success: false, message: "Invalid voucher code" })
        }

        if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: "Voucher code has expired" })
        }

        if (voucher.usedBy && voucher.usedBy.length >= voucher.usageLimit) {
            return res.status(400).json({ success: false, message: "Voucher usage limit has been reached" })
        }

        const alreadyUsed = voucher.usedBy && voucher.usedBy.some(id => id.toString() === userId.toString())
        if (alreadyUsed) {
            return res.status(400).json({ success: false, message: "You have already redeemed this voucher" })
        }

        let discountAmount = 0
        if (voucher.discountType === "percentage") {
            discountAmount = (cartTotal * voucher.discountValue) / 100
        } else {
            discountAmount = Math.min(voucher.discountValue, cartTotal)
        }

        const finalTotal = Math.max(0, cartTotal - discountAmount)

        return res.status(200).json({
            success: true,
            message: "Voucher applied successfully",
            voucher: {
                code: voucher.code,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                discountAmount: Number(discountAmount.toFixed(2)),
                finalTotal: Number(finalTotal.toFixed(2))
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const createVoucher = async (req, res) => {
    try {
        const { code, discountType, discountValue, expiryDate, usageLimit } = req.body

        if (!code || discountValue === undefined) {
            return res.status(400).json({ success: false, message: "Code and discount value are required" })
        }

        const formattedCode = code.toUpperCase().trim()
        const existing = await Voucher.findOne({ code: formattedCode })
        if (existing) {
            return res.status(400).json({ success: false, message: "Voucher code already exists" })
        }

        const newVoucher = new Voucher({
            code: formattedCode,
            discountType: discountType || "percentage",
            discountValue: Number(discountValue),
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            usageLimit: usageLimit ? Number(usageLimit) : 10
        })

        await newVoucher.save()
        return res.status(201).json({ success: true, message: "Voucher created successfully", voucher: newVoucher })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({}).sort({ createdAt: -1 })
        return res.status(200).json({ success: true, count: vouchers.length, vouchers })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const deleteVoucher = async (req, res) => {
    try {
        const { voucherId } = req.params
        const voucher = await Voucher.findByIdAndDelete(voucherId)
        if (!voucher) {
            return res.status(404).json({ success: false, message: "Voucher not found" })
        }
        return res.status(200).json({ success: true, message: "Voucher deleted successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
