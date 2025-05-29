import mongoose from 'mongoose'
import Admin from './admin.model.js'
import Review from './productReview.model.js'



// add these fields

// show images based on color select. right now i am saving an array of strings with me. but i have to store an array of objects. these will contain image url and the name of its color. so that i could access it using color.


const productSchema = new mongoose.Schema({
    title: { type: String, required: true, },
    tagline: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number },
    category: {
        type: String,
        enum: ["household", "laptops", "electronics", "Brochures & Catalogues", "Business Cards", "Design Online", "Flyers Design", "Folded Leaflets", "t-shirt printing", "Gift item printing"],
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    description: { type: String },
    variants: {
        type: [{
            color: { type: String, required: true },
            sizes: { type: [String] },
            quantity: { type: Number, required: true },
            images: { type: [String], required: true },
        }]
    },
    features: { type: [String] },

    tags: { type: [String] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: Admin },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Review,
        default: [],
    }],

})

const Product = new mongoose.model("product", productSchema)

export default Product