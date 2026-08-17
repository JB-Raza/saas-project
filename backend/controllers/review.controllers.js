import Review from '../models/productReview.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'

const updateProductRatingMetrics = async (productId) => {
    const reviews = await Review.find({ product: productId })
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
        ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
        : 0
    await Product.findByIdAndUpdate(productId, { averageRating, totalReviews })
}

export const createReview = async (req, res) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "You must be logged in to add a review" })
        }

        const { productId } = req.params
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "No product found" })
        }

        const userOrders = await Order.find({ user: user._id, orderStatus: "delivered" })
        const validOrderedProduct = userOrders
            .map((order) => order.items.filter(item => item._id?.toString() === productId))
            .flat()[0]

        if (!validOrderedProduct) {
            return res.status(403).json({ success: false, message: "You must purchase and receive this product before reviewing" })
        }

        const existingReview = await Review.findOne({ product: productId, author: user._id })
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product. You can update your existing review."
            })
        }

        const { comment, rating } = req.body
        if (!comment || rating === undefined) {
            return res.status(400).json({ success: false, message: "Both comment and rating are required" })
        }

        const numRating = Number(rating)
        if (numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" })
        }

        const newReview = new Review({
            comment: comment.trim(),
            rating: numRating,
            author: user._id,
            product: product._id
        })
        await newReview.save()

        product.reviews.push(newReview._id)
        await product.save()

        await updateProductRatingMetrics(productId)
        await newReview.populate({ path: 'author', select: "username email" })

        return res.status(201).json({
            success: true,
            message: "Review created successfully",
            newReview
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const updateReview = async (req, res) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "You must be logged in to update a review" })
        }

        const { productId, reviewId } = req.params
        const { comment, rating } = req.body

        if (!comment || rating === undefined) {
            return res.status(400).json({ success: false, message: "Both comment and rating are required" })
        }

        const review = await Review.findById(reviewId)
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" })
        }

        if (review.author.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not allowed to update this review" })
        }

        const numRating = Number(rating)
        if (numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" })
        }

        review.comment = comment.trim()
        review.rating = numRating
        await review.save()

        await updateProductRatingMetrics(productId)

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            updatedReview: review
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const deleteReview = async (req, res) => {
    try {
        const user = req?.user
        if (!user) {
            return res.status(401).json({ success: false, message: "You must be logged in to delete a review" })
        }

        const { productId, reviewId } = req.params
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        const review = await Review.findById(reviewId)
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" })
        }

        if (review.author.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not allowed to delete this review" })
        }

        await review.deleteOne()
        product.reviews.pull(reviewId)
        await product.save()

        await updateProductRatingMetrics(productId)

        return res.status(200).json({ success: true, message: "Review deleted successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getAllProductReviews = async (req, res) => {
    try {
        const { productId } = req.params
        const reviews = await Review.find({ product: productId })
            .populate({ path: "author", select: "username email" })
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
