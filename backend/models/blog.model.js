import mongoose from 'mongoose'
import Admin from './admin.model.js'
import User from './user.model.js'

// const blogSchema = new mongoose.Schema({
//     blogTitle: {
//         type: String,
//         required: true,
//     },
//     datePosted: {
//         type: Date,
//         default: Date.now()
//     },
//     author: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: Admin
//     },
//     comments: {
//         type: [{
//             user: { type: mongoose.Schema.Types.ObjectId, ref: User },
//             comment: { type: String, required: true },
//             createdAt: { type: Date, default: Date.now() }
//         }],
//     },
//     readTime: {
//         type: Number,
//     },
//     bannerImage: {
//         type: String,
//         required: true,
//     },
//     otherImages: {
//         type: [String],
//     },
//     description: {
//         type: String,
//         default: Date.now()
//     },


// })

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
        ref: Admin
    },
    comments: {
        type: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: User },
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