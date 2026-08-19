import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: true })

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    summary: {
        type: String,
        required: true,
        trim: true,
    },
    datePosted: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin"
    },
    comments: [commentSchema],
    readTime: {
        type: Number,
        default: 3,
    },
    views: {
        type: Number,
        default: 0,
    },
    tags: {
        type: [String],
        default: [],
    },
    bannerImage: {
        type: String,
        required: true,
    },
    otherImages: {
        type: [String],
        default: [],
    },
    content: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
})

const Blog = mongoose.model("blog", blogSchema)
export default Blog
