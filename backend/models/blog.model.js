import mongoose from 'mongoose'

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: true,
    },
    datePosted: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin"
    },
    comments: {
        type: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
            comment: { type: String, required: true },
            createdAt: { type: Date, default: Date.now() }
        }],
    },
    readTime: {
        type: Number,
    },
    bannerImage: {
        type: String,
        required: true,
    },
    otherImages: {
        type: [String],
    },
    content: {
        type: String,
        required: true,
    },
})

const Blog = new mongoose.model("blog", blogSchema)

export default Blog