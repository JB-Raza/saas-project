import mongoose from 'mongoose'
import User from './user.model.js'
import Product from './product.model.js'


const reviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})



const Review = mongoose.model("review", reviewSchema)

export default Review