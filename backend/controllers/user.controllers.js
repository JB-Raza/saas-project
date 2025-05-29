import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

// signup
export const signup = async (req, res) => {

    const { username, email, password, confirmPassword } = req.body

    if (!email || !username || !password || !confirmPassword ) return res.status(400).json({ success: false, message: "All Fields are required!" })

    if (password !== confirmPassword) return res.status(400).json({ success: false, message: "password and confirm password should be same!" })

    let checkUser = await User.findOne({ email })
    if (checkUser?.email == email) return res.status(400).json({ success: false, message: "user email Already Exists! use a different email" })

    const hashedPass = bcryptjs.hashSync(password, 10)

    const newUser = new User({ username, email, password: hashedPass })
    await newUser.save()

    res.status(200).json({
        success: true,
        message: "New User Created",
        user: newUser
    })
}

// login
export const login = async (req, res) => {
    const { email, password } = req.body

    // find user
    let user = await User.findOne({ email }).populate("cart")
    if (!user) return res.status(400).json({ success: false, message: "User does not Exist" })

    const validPass = bcryptjs.compareSync(password, user.password)
    if (!validPass) return res.status(400).json({ success: false, message: "Password is Incorrect" })

    if (!user.isActive) return res.status(401).json({ success: false, message: "your access has been revoked by admin" })

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET)

    res.status(200).json({
        success: true,
        message: "Logged In!",
        token,
        profile: { ...user._doc, password: null }
    })

}

export const getUser = (req, res, next) => {
    try {
        const user = req?.user
        if (!user) res.status(401).json({ success: false, message: "could not get user" })

        res.status(200).json({ success: true, user, message: "got the user" })

    } catch (error) {
        next(error)
    }

}

// change password
export const changeUserCredentials = async (req, res) => {

    let { oldPassword, newPassword } = req.body
    let { userId } = req?.params

    let user = await User.findOne({ _id: userId })

    if (!user) return res.status(401).json({ success: false, message: "user doesn't exist" })


    if (!oldPassword) return res.status(401).json({ success: false, message: "you must add your old password" })

    const validatePass = await bcryptjs.compareSync(oldPassword, user.password)
    if (!validatePass) return res.status(401).json({ success: false, message: "incorrect old password" })

    if (!newPassword) return res.status(401).json({ success: false, message: "add a new password" })

    const hashNewPass = await bcryptjs.hashSync(newPassword, 10)
    await User.findByIdAndUpdate(userId, { password: hashNewPass }, { new: true })

    return res.status(200).json({ success: true, message: "Password changed successfully", profile: { ...user._doc, password: null } })

}
