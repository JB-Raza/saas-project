import express from 'express'
import { signup, login, updatePassword, updateUserCredentials, getUser } from '../controllers/adminUser.controllers.js'
import { verifyAdminUser } from '../middlewares.js'
import User from '../models/user.model.js'

import upload from '../cloudinary/cloudinary.js'
let router = express.Router()


router.post("/register", signup)
router.post("/login", login)
router.put("/update/:userId", upload.single("profileImage"), verifyAdminUser, updateUserCredentials)
router.put("/updatePassword/:userId", verifyAdminUser, updatePassword)


router.get("/getUser", verifyAdminUser, getUser)
// get all users
router.get("/getAllUsers", async (req, res) => {
    let allUsers = await User.find({}).select("-password")
    if (allUsers.length == 0) return res.status(400).json({ success: false, message: "No User found" })

    return res.status(200).json({ success: true, allUsers })

})

// change active status of user
router.put("/checkStatus/:userId", verifyAdminUser, async (req, res) => {
    const { userId } = req.params
    let { newActiveState } = req.body

    let user = await User.findByIdAndUpdate(userId, { isActive: newActiveState }, { new: true }).select("-password")

    res.json({ success: true, user, message: `active state changed of ${user.name}` })
})

export default router