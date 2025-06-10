import Review from '../models/productReview.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'

export const createReview = async (req, res) => {
    try {
        const user = req?.user
        if (!user) return res.status(400).json({ success: false, message: "You must be logged in to add a review" })

        const { productId } = req.params
        const product = await Product.findById(productId)

        if (!product) return res.status(404).json({ success: false, message: "No Product Found" })

        const userOrders = await Order.find({ $and: [{ user: user._id }, { orderStatus: "delivered" }] })



        const validOrderedProduct = userOrders.map((order) => order.items.filter(item => item._id == productId)).flat()[0]

        if (!validOrderedProduct) {
            return res.status(401).json({ success: false, message: "you must order and recieve this product to add a review" })
        }


        const userReview = await Review.findOne({
            _id: { $in: product.reviews },
            author: user._id
        });

        if (userReview) {
            return res.status(400).json({
                success: false,
                message: "You already reviewed this product. You can update your existing review."
            });
        }

        const { comment, rating } = req.body

        if (!comment || !rating) return res.status(400).json({ success: false, message: "both comment and rating are required" })



        const newReview = new Review({ comment, rating, author: user._id, product: product._id })
        await newReview.save()
        await newReview.populate({ path: 'author', select: "username email" })
        product.reviews.push(newReview._id)
        await product.save()

        res.status(201).json({
            success: true,
            message: "review created successfully",
            newReview,
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: error?.message || "An error occurred while creating the review.",
        });
    }
}

export const updateReview = async (req, res) => {
    try {
        const user = req?.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "You must be logged in to update a review" });
        }

        const { productId, reviewId } = req.params;
        const { comment, rating } = req.body;

        if (!comment || !rating) {
            return res.status(400).json({ success: false, message: "Both comment and rating are required" });
        }

        const productExists = await Product.exists({ _id: productId });
        if (!productExists) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (review.author.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not allowed to update this review" });
        }

        review.comment = comment;
        review.rating = rating;
        await review.save();

        res.status(200).json({ success: true, message: "Review updated successfully", updatedReview: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message || "Something went wrong" });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const user = req?.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "You must be logged in to delete a review" });
        }

        const { productId, reviewId } = req.params;

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (review.author.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not allowed to delete this review" });
        }

        await review.deleteOne()
        product.reviews.pull(reviewId)
        await product.save()


        res.status(200).json({ success: true, message: "review deleted successfully" })

    } catch (error) {
        res.status(500).json({ success: false, message: error?.message || "Something went wrong" });
    }
}

export const getAllProductReviews = async (req, res) => {
    try {
        const { productId } = req.params
        const product = await Product.findById(productId).populate({ path: 'reviews', populate: { path: "author", select: "username email" } })


        if (!product) return res.status(404).json({ success: false, message: "no product found" })

        const allReviews = product.reviews

        res.status(200).json({ success: true, allReviews })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error?.message || "Something went wrong" });
    }
}
