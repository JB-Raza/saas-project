import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body

        if (!email || !username || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email address format" })
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Password and confirm password must match" })
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() })
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email is already registered" })
        }

        const existingUsername = await User.findOne({ username: username.trim() })
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username is already taken" })
        }

        const hashedPass = bcryptjs.hashSync(password, 10)
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPass
        })
        await newUser.save()

        const profile = newUser.toObject()
        delete profile.password

        return res.status(201).json({
            success: true,
            message: "User account created successfully",
            user: profile
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("wishlist")
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password" })
        }

        const validPass = bcryptjs.compareSync(password, user.password)
        if (!validPass) {
            return res.status(400).json({ success: false, message: "Invalid email or password" })
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Your access has been revoked by admin" })
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        const profile = user.toObject()
        delete profile.password

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            profile
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getUser = (req, res) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" })
        }

        const profile = user.toObject ? user.toObject() : { ...user }
        delete profile.password

        return res.status(200).json({ success: true, user: profile })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const changeUserCredentials = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        const { userId } = req.params

        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized to modify another user's credentials" })
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both old and new passwords are required" })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" })
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        const validatePass = bcryptjs.compareSync(oldPassword, user.password)
        if (!validatePass) {
            return res.status(401).json({ success: false, message: "Incorrect current password" })
        }

        const hashNewPass = bcryptjs.hashSync(newPassword, 10)
        user.password = hashNewPass
        await user.save()

        const profile = user.toObject()
        delete profile.password

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
            profile
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
