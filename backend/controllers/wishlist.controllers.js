import Product from '../models/product.model.js'

export const addRemoveWishlistItem = async (req, res) => {
    try {
        const user = req.user
        const { productId } = req.params
        if (!user) return res.status(400).json({ success: false, message: "you must be logged in to add items to wishlist" })


        const product = await Product.findById(productId)
        if (!product) return res.status(400).json({ success: false, message: "no product found" })

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId)
            await user.save()
            return res.status(200).json({ success: true, itemExists: false, message: "Product added to wishlist." });
        }
        else {
            const index = user.wishlist.indexOf(productId)
            if (index > -1) {
                user.wishlist.splice(index, 1)
                await user.save()
                return res.status(200).json({ success: true, itemExists: true, message: 'item removed from wishlist' })
            }
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "internal error hae in add wishlist" })
    }
}

export const getWishlist = async (req, res) => {
    try {
        const user = req.user
        if (!user) return res.status(400).json({ success: false, message: "you must be logged in to remove items from wishlist" })

        await user.populate("wishlist")

        res.status(200).json({ success: true, wishlist: user.wishlist });


    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "internal error hae in add wishlist" })
    }
}