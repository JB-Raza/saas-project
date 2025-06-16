import express from 'express'
const router = express.Router()

import { createOrder, cancelOrder, getAllOrders, getAllUserOrders, updateOrderStatus, placePaypalOrder } from '../controllers/order.controllers.js'
import { verifyUser, verifyAdminUser } from '../middlewares.js'

router.get("/", getAllOrders)
router.post("/new", verifyUser, createOrder)
router.get("/getUserOrders", verifyUser, getAllUserOrders)
router.patch("/:orderId/cancel", verifyAdminUser, cancelOrder)
router.patch("/:orderId/status", verifyAdminUser, updateOrderStatus)


router.post("/capture-paypal-order", verifyUser, placePaypalOrder)




export default router