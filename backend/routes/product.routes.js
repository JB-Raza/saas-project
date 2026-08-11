import express from 'express'
import {
    getProduct,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchQueryData
} from '../controllers/product.controllers.js'
import upload from '../cloudinary/cloudinary.js'
import { verifyAdminUser } from '../middlewares.js'
import Product from '../models/product.model.js'

const router = express.Router()

router.get("/", getAllProducts)

router.get("/categories", async (req, res) => {
    try {
        const categoriesObjArr = await Product.find({}).select("category")
        const categories = [...new Set(categoriesObjArr.map(item => item.category))]
        return res.status(200).json({ success: true, categories })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

router.get("/search", searchQueryData)

router.get("/:productId/availability", async (req, res) => {
    try {
        const { productId } = req.params
        const { color, size } = req.query

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        if (!color) {
            return res.status(200).json({
                success: true,
                productId: product._id,
                totalStock: product.totalStock,
                inStock: product.inStock,
                variants: product.variants.map(v => ({
                    color: v.color,
                    quantity: v.quantity,
                    sizes: v.sizes
                }))
            })
        }

        const matchedVariant = product.variants.find(v => v.color.toLowerCase() === color.toLowerCase())
        if (!matchedVariant) {
            return res.status(404).json({ success: false, message: "Variant color not found" })
        }

        const hasSize = !size || (matchedVariant.sizes || []).includes(size)
        return res.status(200).json({
            success: true,
            color: matchedVariant.color,
            availableQuantity: matchedVariant.quantity,
            hasSize,
            isAvailable: matchedVariant.quantity > 0 && hasSize
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

router.post("/create", verifyAdminUser, upload.array("images"), createProduct)
router.put("/:productId/update", verifyAdminUser, upload.array("images"), updateProduct)
router.delete("/:productId/delete", verifyAdminUser, deleteProduct)
router.get("/:productId", getProduct)

export default router
