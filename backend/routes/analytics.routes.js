import express from 'express'
import { getDashboardSummary, getSalesByCategory } from '../controllers/analytics.controllers.js'
import { verifyAdminUser } from '../middlewares.js'

const router = express.Router()

router.get("/summary", verifyAdminUser, getDashboardSummary)
router.get("/sales-by-category", verifyAdminUser, getSalesByCategory)

export default router
