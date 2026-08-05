import express from 'express'
import {
    applyVoucher,
    createVoucher,
    getAllVouchers,
    deleteVoucher
} from '../controllers/voucher.controllers.js'
import { verifyUser, verifyAdminUser } from '../middlewares.js'

const router = express.Router()

router.post("/apply", verifyUser, applyVoucher)
router.get("/all", verifyAdminUser, getAllVouchers)
router.post("/create", verifyAdminUser, createVoucher)
router.delete("/:voucherId", verifyAdminUser, deleteVoucher)

export default router
