import express from 'express'
import { verifyUser } from '../middlewares.js'
import { addRemoveWishlistItem, getWishlist } from '../controllers/wishlist.controllers.js'

const router = express.Router()


router.get("/", verifyUser, getWishlist)
router.post("/:productId/addRemoveWishlistItem", verifyUser, addRemoveWishlistItem)




export default router