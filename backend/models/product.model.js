import mongoose from 'mongoose'

const variantSchema = new mongoose.Schema({
    color: { type: String, required: true },
    sizes: { type: [String], default: [] },
    quantity: { type: Number, required: true, min: 0 },
    images: { type: [String], required: true },
}, { _id: true })

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    sku: { type: String, sparse: true, trim: true },
    tagline: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    category: {
        type: String,
        enum: ["household", "laptops", "electronics", "Brochures & Catalogues", "Business Cards", "Design Online", "Flyers Design", "Folded Leaflets", "t-shirt printing", "Gift item printing"],
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    description: { type: String, trim: true },
    variants: [variantSchema],
    totalStock: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
    otherDetails: { type: String },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "review",
        default: [],
    }],
}, {
    timestamps: true
})

productSchema.pre("save", function (next) {
    if (this.variants && this.variants.length > 0) {
        this.totalStock = this.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
        this.inStock = this.totalStock > 0
    }
    if (!this.sku && this._id) {
        this.sku = `PRD-${this._id.toString().slice(-6).toUpperCase()}`
    }
    next()
})

const Product = mongoose.model("product", productSchema)
export default Product
