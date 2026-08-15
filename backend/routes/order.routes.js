import express from 'express'
import {
    createOrder,
    cancelOrder,
    customerCancelOrder,
    getAllOrders,
    getAllUserOrders,
    updateOrderStatus,
    placePaypalOrder,
    trackOrderByNumber
} from '../controllers/order.controllers.js'
import { verifyUser, verifyAdminUser } from '../middlewares.js'

const router = express.Router()

router.get("/track/:trackingNumber", trackOrderByNumber)
router.get("/", verifyAdminUser, getAllOrders)
router.post("/new", verifyUser, createOrder)
router.get("/getUserOrders", verifyUser, getAllUserOrders)
router.patch("/:orderId/customer-cancel", verifyUser, customerCancelOrder)
router.patch("/:orderId/cancel", verifyAdminUser, cancelOrder)
router.patch("/:orderId/status", verifyAdminUser, updateOrderStatus)
router.post("/capture-paypal-order", verifyUser, placePaypalOrder)

export default router
