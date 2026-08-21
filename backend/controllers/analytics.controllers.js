import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import User from '../models/user.model.js'

export const getDashboardSummary = async (req, res) => {
    try {
        const [totalCustomers, totalProducts, orders, lowStockProducts] = await Promise.all([
            User.countDocuments({ role: "customer" }),
            Product.countDocuments({}),
            Order.find({}).sort({ createdAt: -1 }),
            Product.find({ totalStock: { $lte: 5 } }).select("title sku totalStock price").limit(10)
        ])

        const totalOrders = orders.length
        const totalRevenue = orders
            .filter(o => o.orderStatus !== "cancelled")
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0)

        const ordersByStatus = orders.reduce((acc, order) => {
            acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1
            return acc
        }, {})

        const recentOrders = orders.slice(0, 5).map(o => ({
            id: o._id,
            trackingNumber: o.trackingNumber,
            totalPrice: o.totalPrice,
            orderStatus: o.orderStatus,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            createdAt: o.createdAt
        }))

        return res.status(200).json({
            success: true,
            summary: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalOrders,
                totalProducts,
                totalCustomers,
                ordersByStatus,
                lowStockCount: lowStockProducts.length,
                lowStockProducts,
                recentOrders
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getSalesByCategory = async (req, res) => {
    try {
        const deliveredOrders = await Order.find({ orderStatus: { $ne: "cancelled" } })

        const categorySales = {}
        deliveredOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const category = item.category || "General"
                categorySales[category] = (categorySales[category] || 0) + (item.totalPriceAfterDiscount || 0)
            })
        })

        const formatted = Object.entries(categorySales).map(([category, revenue]) => ({
            category,
            revenue: Number(revenue.toFixed(2))
        }))

        return res.status(200).json({
            success: true,
            salesByCategory: formatted
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
