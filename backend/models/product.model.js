import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, },
    tagline: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
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
    author: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },

    otherDetails: { // this will be the data coming from text rich docuemnt (tiny mce)
        type: String
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "review",
        default: [],
    }],

})

const Product = new mongoose.model("product", productSchema)

export default Product