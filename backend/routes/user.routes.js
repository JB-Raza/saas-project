import express from 'express'
import {
    login,
    signup,
    changeUserCredentials,
    getUser,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress
} from '../controllers/user.controllers.js'
import { verifyUser } from '../middlewares.js'

const router = express.Router()

router.post("/signup", signup)
router.post('/login', login)
router.get("/getUser", verifyUser, getUser)
router.put('/:userId/update', verifyUser, changeUserCredentials)

router.get("/addresses", verifyUser, getAddresses)
router.post("/addresses", verifyUser, addAddress)
router.put("/addresses/:addressId", verifyUser, updateAddress)
router.delete("/addresses/:addressId", verifyUser, deleteAddress)

export default router
