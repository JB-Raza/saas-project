import express from 'express'
const router = express.Router()

import { cancelOrder, createOrderSession, getAllOrders, getAllUserOrders, placeOrder, updateOrderStatus } from '../controllers/order.controllers.js'
import { verifyUser, verifyAdminUser } from '../middlewares.js'

router.get("/", getAllOrders)

router.post("/new", verifyUser, placeOrder)
router.get("/getUserOrders", verifyUser, getAllUserOrders)
router.patch("/:orderId/cancel", verifyAdminUser, cancelOrder)
router.patch("/:orderId/status", verifyAdminUser, updateOrderStatus)





export default router