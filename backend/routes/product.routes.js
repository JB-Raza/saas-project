import express from 'express'
const router = express.Router()


// controllers
import { getProduct, getAllProducts, createProduct, updateProduct, deleteProduct, searchQueryData } from '../controllers/product.controllers.js'

// middlewares 
import upload from '../cloudinary/cloudinary.js'
import { verifyAdminUser } from '../middlewares.js'
import Product from '../models/product.model.js'


router.get("/", getAllProducts)

router.get("/categories", async (req, res) => {
    try {
        const categoriesObjArr = await Product.find({}).select("category")
        const categories = [...new Set(categoriesObjArr.map(item => item.category))]
        res.status(200).json({ success: true, categories })
    } catch (error) {
        console.log(error.message)
    }
})

router.get("/search", searchQueryData)
router.post("/create", verifyAdminUser, upload.array("images"), createProduct)
router.put("/:productId/update", verifyAdminUser, upload.array("images"), updateProduct)
router.delete("/:productId/delete", verifyAdminUser, deleteProduct)
router.get("/:productId", getProduct)


export default router
