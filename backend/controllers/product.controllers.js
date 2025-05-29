import Product from '../models/product.model.js'
import { cloudinary } from '../cloudinary/cloudinary.js'

// get product
export const getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params
        if (!productId) return res.status(404).json({ success: false, message: "no product id matched" })

        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({ success: false, message: "no product found" })

        res.status(200).json({
            success: true,
            message: "Product Found",
            product
        })
    } catch (error) {
        next(error)
    }
}

// get all products
export const getAllProducts = async (req, res, next) => {

    try {
        // to fetch featured products from this route
        const { query } = req?.query
        let allProducts
        if (query && query == "featured") allProducts = await Product.find({ isFeatured: true }).limit(4)
        else allProducts = await Product.find({})

        if (allProducts.length == 0) return res.status(404).json({ success: false, message: "no products found in database" })
        res.status(200).json({ success: true, message: "products fetched successfully", allProducts })
    } catch (error) {
        next(error)
    }
}

// create product
export const createProduct = async (req, res, next) => {
    try {
        const user = req?.user

        if (!user) return res.status(400).json({ success: false, message: "you must login to create a new product" })
        const files = req?.files
        let { variants, ...restOfProductData } = req.body

        variants = JSON.parse(variants)
        const fileUrls = files?.map(file => file.path)

        let fileIndex = 0

        const updatedvariants = variants.map((variant) => {
            const numberOfImages = variant.fileCount || 0
            const images = fileUrls.slice(fileIndex, fileIndex + numberOfImages)
            fileIndex += numberOfImages
            return {
                ...variant,
                images
            }
        })

        const newProduct = new Product({ author: user._id, ...restOfProductData, variants: updatedvariants })
        await newProduct.save()
        res.status(200).json({ success: true, message: "Product created successfully", newProduct })

    } catch (error) {
        console.log("err = ", error)
    }
}

// update product
export const updateProduct = async (req, res, next) => {
    try {

        const user = req?.user
        if (!user) return res.status(400).json({ success: false, message: "you are not authorized to update this product" })

        const files = req.files
        const fileUrls = files.map((file) => file.path)

        const { productId } = req.params
        if (!productId) return res.status(404).json({ success: false, message: "no product id found" })

        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({ success: false, message: "no product found of this id" })

        let { variants, ...restOfProductData } = req?.body

        variants = JSON.parse(variants)

        // previous images

        let variImages = (variants || []).map((vari) =>
            (vari.images || []).filter((img) => typeof img == 'string')
        )



        // if added new files, they are embeded as empty objects

        let fileIndex = 0
        const updatedvariants = variants.map((variant, index) => {
            const numberOfImages = variant.fileCount || 0
            const images = fileUrls.slice(fileIndex, fileIndex + numberOfImages)
            fileIndex += numberOfImages

            return {
                ...variant,
                images: [...variImages[index], ...images]
            }
        })




        const updatedProduct = await Product.findByIdAndUpdate(productId, { variants: updatedvariants, ...restOfProductData }, { new: true, runValidators: true })
        res.status(200).json({ success: true, message: "product updated successfully", updatedProduct })

    } catch (error) {
        console.error("error aa gia sir = ", error?.message)
    }
}

// search query
export const searchQueryData = async (req, res) => {
    try {
        const searchQuery = req?.query.searchQuery
        const searchQueryData = await Product.find({
            $or: [
                { title: { $regex: searchQuery, $options: "i" } },
                { tags: { $in: [searchQuery] } },
                { category: { $regex: searchQuery, $options: "i" } },
            ]
        })

        res.status(200).json({ success: true, searchQueryData })
    } catch (error) {
        console.log("query error : ", error.message)
    }
}

// delete product
export const deleteProduct = async (req, res, next) => {
    const { productId } = req.params
    if (!productId) return res.status(404).json({ success: false, message: "no product ID found" })

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ success: false, message: "no product found to be Delete" })

        // deleting images from cloudinary storage too
        (product.variants || []).map((variant) => {
            (variant.images || []).map((imgUrl) => {
                const url = imgUrl.split("/")
                const fileName = url.pop().split(".")[0]
                const folderName = url.pop()
                const filePath = `${folderName}/${fileName}`
                cloudinary.uploader.destroy(filePath, (err, result) => {
                    if (err) console.log("failed to delete image : ", err)
                    else console.log("image deleted successfully : ", result.result)
                })
            })
        })

    await Product.findByIdAndDelete(productId)
    res.status(200).json({ success: true, message: "Product deleted successfully" })
}

