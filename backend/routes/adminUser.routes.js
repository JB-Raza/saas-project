import express from 'express'
import { signup, login, updatePassword, updateUserCredentials, getUser } from '../controllers/adminUser.controllers.js'
import { verifyAdminUser } from '../middlewares.js'
import User from '../models/user.model.js'
import upload from '../cloudinary/cloudinary.js'

const router = express.Router()

router.post("/register", signup)
router.post("/login", login)
router.put("/update/:userId", upload.single("profileImage"), verifyAdminUser, updateUserCredentials)
router.put("/updatePassword/:userId", verifyAdminUser, updatePassword)
router.get("/getUser", verifyAdminUser, getUser)

router.get("/getAllUsers", verifyAdminUser, async (req, res) => {
    try {
        const allUsers = await User.find({}).select("-password")
        return res.status(200).json({ success: true, allUsers })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/checkStatus/:userId", verifyAdminUser, async (req, res) => {
    try {
        const { userId } = req.params
        const { newActiveState } = req.body

        const user = await User.findByIdAndUpdate(userId, { isActive: newActiveState }, { new: true }).select("-password")
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        return res.status(200).json({ success: true, user, message: `Active state changed for ${user.username}` })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

export default router
