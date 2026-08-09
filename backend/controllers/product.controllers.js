import Product from '../models/product.model.js'
import { cloudinary } from '../cloudinary/cloudinary.js'

export const getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" })
        }

        const product = await Product.findById(productId).populate({
            path: "reviews",
            populate: { path: "user", select: "username email" }
        })
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        return res.status(200).json({
            success: true,
            message: "Product found",
            product
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getAllProducts = async (req, res, next) => {
    try {
        const { query, category, minPrice, maxPrice, inStock, rating, sort, page = 1, limit = 20 } = req.query

        const filter = {}

        if (query === "featured") {
            filter.isFeatured = true
        }

        if (category) {
            filter.category = category
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {}
            if (minPrice !== undefined && minPrice !== "") {
                filter.price.$gte = Number(minPrice)
            }
            if (maxPrice !== undefined && maxPrice !== "") {
                filter.price.$lte = Number(maxPrice)
            }
        }

        if (inStock !== undefined) {
            filter.inStock = inStock === "true" || inStock === true
        }

        if (rating !== undefined && rating !== "") {
            filter.averageRating = { $gte: Number(rating) }
        }

        let sortOption = { createdAt: -1 }
        if (sort === "price_asc") {
            sortOption = { price: 1 }
        } else if (sort === "price_desc") {
            sortOption = { price: -1 }
        } else if (sort === "rating") {
            sortOption = { averageRating: -1 }
        } else if (sort === "newest") {
            sortOption = { createdAt: -1 }
        }

        const pageNum = Math.max(1, parseInt(page, 10))
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)))
        const skip = (pageNum - 1) * limitNum

        const totalProducts = await Product.countDocuments(filter)
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)

        return res.status(200).json({
            success: true,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limitNum),
            currentPage: pageNum,
            count: products.length,
            allProducts: products
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const createProduct = async (req, res, next) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "Authentication required to create product" })
        }

        const files = req?.files || []
        let { variants, ...restOfProductData } = req.body

        if (typeof variants === 'string') {
            variants = JSON.parse(variants)
        }

        const fileUrls = files.map(file => file.path)
        let fileIndex = 0

        const updatedVariants = (variants || []).map((variant) => {
            const numberOfImages = variant.fileCount || 0
            const images = fileUrls.slice(fileIndex, fileIndex + numberOfImages)
            fileIndex += numberOfImages
            return {
                ...variant,
                images
            }
        })

        const newProduct = new Product({
            author: user._id,
            ...restOfProductData,
            variants: updatedVariants
        })
        await newProduct.save()

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            newProduct
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const updateProduct = async (req, res, next) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized to update this product" })
        }

        const files = req.files || []
        const fileUrls = files.map((file) => file.path)
        const { productId } = req.params

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        let { variants, ...restOfProductData } = req.body
        if (typeof variants === 'string') {
            variants = JSON.parse(variants)
        }

        let updatedVariants = product.variants
        if (variants && Array.isArray(variants)) {
            const variImages = variants.map((vari) =>
                (vari.images || []).filter((img) => typeof img === 'string')
            )

            let fileIndex = 0
            updatedVariants = variants.map((variant, index) => {
                const numberOfImages = variant.fileCount || 0
                const images = fileUrls.slice(fileIndex, fileIndex + numberOfImages)
                fileIndex += numberOfImages
                return {
                    ...variant,
                    images: [...(variImages[index] || []), ...images]
                }
            })
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { variants: updatedVariants, ...restOfProductData },
            { new: true, runValidators: true }
        )

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            updatedProduct
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const searchQueryData = async (req, res) => {
    try {
        const searchQuery = req.query.searchQuery
        if (!searchQuery || !searchQuery.trim()) {
            return res.status(200).json({ success: true, searchQueryData: [] })
        }

        const term = searchQuery.trim()
        const searchQueryData = await Product.find({
            $or: [
                { title: { $regex: term, $options: "i" } },
                { tags: { $in: [term] } },
                { category: { $regex: term, $options: "i" } },
                { sku: { $regex: term, $options: "i" } }
            ]
        })

        return res.status(200).json({ success: true, count: searchQueryData.length, searchQueryData })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        (product.variants || []).forEach((variant) => {
            (variant.images || []).forEach((imgUrl) => {
                if (typeof imgUrl === 'string') {
                    const url = imgUrl.split("/")
                    const fileName = url.pop()?.split(".")[0]
                    const folderName = url.pop()
                    if (folderName && fileName) {
                        const filePath = `${folderName}/${fileName}`
                        cloudinary.uploader.destroy(filePath).catch(() => {})
                    }
                }
            })
        })

        await Product.findByIdAndDelete(productId)
        return res.status(200).json({ success: true, message: "Product deleted successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
