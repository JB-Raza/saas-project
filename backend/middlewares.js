import jwt from 'jsonwebtoken'
import Admin from './models/admin.model.js'
import User from './models/user.model.js'
import Stripe from 'stripe'
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv'

dotenv.config()



export const verifyAdminUser = async (req, res, next) => {
    try {
        let authHeader = req.headers?.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token found" })
        }

        const token = authHeader.split(" ")[1]

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await Admin.findById(verifyToken.id).select("-password")

        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        req.user = user
        next()

    } catch (error) {
        console.log("error in token access = ", error?.message)
        return res.status(403).json({ success: false, message: "Token verification failed", error: error.message });

    }


}

export const verifyUser = async (req, res, next) => {

    try {
        let authHeader = req?.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("no token found")
            return res.status(401).json({ success: false, message: "No token found" })
        }

        const token = authHeader.split(" ")[1]
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(verifyToken.id).select("-password")

        if (!user) {
            console.log("no user found")
            return res.status(404).json({ success: false, message: "User not found" })
        }
        req.user = user
        next()

    } catch (error) {
        console.log("error in token access = ", error?.message)
    }
}


// paypal

function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID;
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials are missing from environment variables");
    }
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
export { paypalClient, checkoutNodeJssdk }

