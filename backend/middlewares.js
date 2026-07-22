import jwt from 'jsonwebtoken'
import Admin from './models/admin.model.js'
import User from './models/user.model.js'
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv'

dotenv.config()

export const verifyAdminUser = async (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token found" })
        }

        const token = authHeader.split(" ")[1]
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await Admin.findById(verifyToken.id).select("-password")
        if (!user) {
            return res.status(404).json({ success: false, message: "Admin user not found" })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Admin token verification failed",
            error: error.message
        })
    }
}

export const verifyUser = async (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token found" })
        }

        const token = authHeader.split(" ")[1]
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(verifyToken.id).select("-password")
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account has been deactivated" })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token verification failed",
            error: error.message
        })
    }
}

function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials are missing from environment variables");
    }
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
export { paypalClient, checkoutNodeJssdk }
