import express from 'express'
import { verifyUser } from '../middlewares.js'
import { createReview, updateReview, deleteReview, getAllProductReviews } from '../controllers/review.controllers.js'

const router = express.Router({ mergeParams: true })

router.get("/", getAllProductReviews)
router.post("/create", verifyUser, createReview)
router.put("/:reviewId/update", verifyUser, updateReview)
router.delete("/:reviewId/delete", verifyUser, deleteReview)


export default router