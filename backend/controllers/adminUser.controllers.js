import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/admin.model.js'



// signup
export const signup = async (req, res) => {

  const { about, username, email, password } = req.body

  let name = about.name

  if (!name || !password || !email || !username) return res.status(400).json({ success: false, message: "All Fields are required!" })


  let checkUser = await Admin.findOne({ $or: [{ name }, { email }] })
  if (checkUser?.name == name) return res.status(400).json({ success: false, message: "user name Already Exists! use a different name" })
  if (checkUser?.email == email) return res.status(400).json({ success: false, message: "user email Already Exists! use a different email" })

  const hashedPass = bcryptjs.hashSync(password, 10)

  const newUser = new Admin({ name, username, email, password: hashedPass })
  await newUser.save()

  res.status(200).json({
    success: true,
    message: "New User Created",
    user: {
      about: { name: newUser.name },
      ...newUser,
    }
  })
}

// login
export const login = async (req, res) => {
  const { email, password } = req.body

  // find user
  let user = await Admin.findOne({ email })
  if (!user) return res.status(400).json({ success: false, message: "User does not Exist" })

  const validPass = bcryptjs.compareSync(password, user.password)
  if (!validPass) return res.status(400).json({ success: false, message: "Password is Incorrect" })


    
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET)


  res.status(200).json({
    success: true,
    message: "Logged In!",
    token,
    profile: { ...user._doc, password: null }
  })
}

// change password
export const updatePassword = async (req, res) => {

  let { oldPassword, newPassword, confirmPassword } = req.body
  let { userId } = req?.params

  let user = await Admin.findOne({ _id: userId })

  if (!user) return res.status(401).json({ success: false, message: "user doesn't exist" })


  if (!oldPassword) return res.status(401).json({ success: false, message: "you must add your old password" })

  if (newPassword !== confirmPassword) return res.status(401).json({ success: false, message: "new password and confirm new password should be same" })

  const validatePass = bcryptjs.compareSync(oldPassword, user.password)
  if (!validatePass) return res.status(401).json({ success: false, message: "incorrect old password" })

  if (!newPassword) return res.status(401).json({ success: false, message: "add a new password" })

  const hashNewPass = bcryptjs.hashSync(newPassword, 10)
  await Admin.findByIdAndUpdate(userId, { password: hashNewPass }, { new: true })

  return res.status(200).json({ success: true, message: "Password changed successfully", profile: { about: { name: user._doc.name }, ...user._doc, password: null } })

}

// update admin credentials
export const updateUserCredentials = async (req, res, next) => {
  try {
    const file = req?.file || null;
    const { name, email, username } = req.body;
    const { userId } = req.params;

    const user = await Admin.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const updatedUser = await Admin.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        username,
        profileImage: file?.path || req.body.profileImage
      },
      { new: true }
    );



    return res.status(200).json({
      success: true,
      message: "User information updated successfully",
      profile: {
        ...updatedUser._doc,
        about: { name: updatedUser.name, profileImage: updatedUser.profileImage },
        password: null
      }
    });
  } catch (error) {
    console.error("Error while updating profile:", error);
    next(error)
  }
};

// get user
export const getUser = (req, res) => {
  try {
    let user = req?.user
    if (user) {
      return res.status(200).json({ success: "success", profile: { ...user._doc } })
    }
  } catch (error) {
    console.log(error)
  }
}

