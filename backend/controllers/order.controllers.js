import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import Voucher from '../models/voucher.model.js'

import Stripe from 'stripe'

// paypal
import { paypalClient, checkoutNodeJssdk } from '../middlewares.js'

// stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


export const createOrder = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, message: "You must be logged in to place order" });


        const orderData = req.body;

        let { cart, ...otherOrderDetails } = orderData;
        cart = JSON.parse(cart);

        // calculating each item's totalPriceAfterDiscount * item.quantity

        cart = cart.map(item => {
            let discountAmount = (item.discount * item.price) / 100

            const discountedPrice = item.price - discountAmount;
            const totalPriceAfterDiscount = discountedPrice * item.quantity;

            return {
                ...item,
                totalPriceAfterDiscount,
            };
        });

        const requiredFields = ["paymentMethod", "firstName", "lastName", "address", "phone", "zipCode"];
        for (const field of requiredFields) {
            if (!otherOrderDetails[field]) {
                console.log(`Field '${field}' is required`)
                return res.status(400).json({ success: false, message: `Field '${field}' is required` });
            }
        }
        // Validate cart items
        const validCartItems = await Promise.all(
            cart.map(async (product) => {
                const checkProduct = await Product.findById(product._id);

                if (!checkProduct || checkProduct.price !== product.price || checkProduct.discount !== product.discount) return null;

                const matchedVariant = checkProduct.variants.find((variant) => {
                    if (variant.color !== product.variant.color) return false;

                    if ((variant.sizes || []).length > 0) {
                        return variant.sizes.includes(product.variant.size);
                    }
                    return true;
                });

                if (!matchedVariant || matchedVariant.quantity < product.quantity) {
                    return null;
                }
                return product;
            })
        );

        const cartItemsToOrder = validCartItems.filter(Boolean);

        if (cartItemsToOrder.length === 0) {
            console.log("no valid products in cart")
            return res.status(400).json({ success: false, message: "No valid products in cart" });
        }

        const { voucherCode } = otherOrderDetails
        const validVoucherCode = await Voucher.findOne({ code: voucherCode })


        // Calculate total price
        let totalPrice = cartItemsToOrder.reduce((acc, elem) => {
            let pricePerItem = elem.price;
            if (elem.discount) {
                pricePerItem -= (elem.discount * elem.price) / 100;
            }
            return acc + pricePerItem * elem.quantity;
        }, 0);


        // applying voucher
        let voucherDiscountVal = 0
        if (validVoucherCode !== null && (validVoucherCode.usedBy || []).length < validVoucherCode.usageLimit) {
            if (validVoucherCode.discountType == "percentage") {
                voucherDiscountVal = (totalPrice * validVoucherCode.discountValue) / 100
            }
            else if (validVoucherCode.discountType == "flat") {
                voucherDiscountVal = validVoucherCode.discountValue
            }
            totalPrice = totalPrice - voucherDiscountVal
        }


        const trackingCount = await Order.countDocuments();
        const trackingNumber = String(trackingCount + 1).padStart(4, '0')

        const newOrder = new Order({
            user: user._id,
            totalPrice,
            paymentMethod: otherOrderDetails.paymentMethod,
            items: cartItemsToOrder,
            orderStatus: "processing",
            voucher: {
                code: validVoucherCode && (validVoucherCode.usedBy || []).length < validVoucherCode.usageLimit ? validVoucherCode.code : "",
                discountType: validVoucherCode && (validVoucherCode.usedBy || []).length < validVoucherCode?.usageLimit ? validVoucherCode.discountType : "percentage",
                discountValue: voucherDiscountVal,
            },
            comment: otherOrderDetails.comment,
            trackingNumber,
            deliveryInfo: {
                address: otherOrderDetails.address,
                apartment: otherOrderDetails.apartment,
                city: otherOrderDetails.city,
                phone: otherOrderDetails.phone
            }
        });
        // stripe setup
        // adding a coupon if applied to stripe too
        if (otherOrderDetails.paymentMethod == "stripe") {

            let discountCoupon
            if (validVoucherCode && validVoucherCode.code !== "" && (validVoucherCode.usedBy || []).length < validVoucherCode.usageLimit) {
                discountCoupon = await stripe.coupons.create({
                    amount_off: voucherDiscountVal * 100, // takes value in cents (not dollars) that's why multiply with 100
                    currency: "usd",
                    duration: "once",
                })
            }

            let session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: "payment",
                line_items: cartItemsToOrder.map((product) => ({
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: product.title,
                            images: [product.variant.image],
                        },
                        unit_amount: Math.round((product.totalPriceAfterDiscount * 100) / product.quantity), // stripe takes the minimum unit of price according to currency, in usd, cent is the smallest unit as (100 cents == 1 dollar)
                    },
                    quantity: product.quantity,
                })),
                metadata: {
                    orderId: newOrder._id.toString(),
                },
                success_url: "http://localhost:5173/shop",
                cancel_url: "http://localhost:5173/checkout",
                expires_at: Math.round((Date.now() / 1000) + 1800), // it takes time in seconds, Date.now() gives time in miliseconds
                discounts: discountCoupon ? [{ coupon: discountCoupon.id }] : []
            })

            newOrder.orderStatus = "pending"

            await newOrder.save()
            return res.status(200).json({ success: true, sessionId: session.id, message: "session created successfully" });
        }

        // paypal setup
        else if (otherOrderDetails.paymentMethod == "paypal") {

            const items = newOrder.items.map((item) => {
                const unitPrice = item.totalPriceAfterDiscount / item.quantity;
                return {
                    name: item.title,
                    unit_amount: {
                        currency_code: "USD",
                        value: unitPrice.toFixed(2)
                    },
                    quantity: item.quantity.toString()
                };
            });

            const itemTotal = items.reduce((acc, item) => {
                return acc + parseFloat(item.unit_amount.value) * parseInt(item.quantity);
            }, 0).toFixed(2);

            const discountAmount = parseFloat(voucherDiscountVal).toFixed(2);

            const finalAmount = (itemTotal - discountAmount).toFixed(2);

            const request = new checkoutNodeJssdk.orders.OrdersCreateRequest()
            request.prefer("return=representation")
            request.requestBody({
                intent: "CAPTURE",
                purchase_units: [{
                    amount: {
                        currency_code: "USD",
                        value: finalAmount,
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: itemTotal
                            },
                            discount: {
                                currency_code: "USD",
                                value: discountAmount
                            }
                        }
                    },
                    items
                }]
            });


            try {
                const order = await paypalClient.execute(request)
                // saving order
                if (order) {

                    newOrder.orderStatus = "pending"
                    await newOrder.save()

                    // changing products quantity
                    await Promise.all(
                        cartItemsToOrder.map(async (product) => {
                            await Product.updateOne(
                                { _id: product._id, "variants.color": product.variant.color },
                                { $inc: { "variants.$.quantity": -product.quantity } }
                            )
                        })
                    )


                    // saving voucher code (if applied)
                    if (validVoucherCode !== null) {
                        (validVoucherCode.usedBy || []).push(user._id)
                        await validVoucherCode.save()
                    }
                    return res.json({ success: true, paypalOrderID: order.result.id, dbOrderID: newOrder._id })
                }
            } catch (error) {
                console.log(error)
                return res.status(500).json({ message: "could not create paypal order", error: error.message })
            }
        }

        // cash on Delivery

        await newOrder.save()

        if (validVoucherCode !== null) {
            (validVoucherCode.usedBy || []).push(user._id)
            await validVoucherCode.save()
        }
        await Promise.all(
            cartItemsToOrder.map(async (product) => {
                await Product.updateOne(
                    { _id: product._id, "variants.color": product.variant.color },
                    { $inc: { "variants.$.quantity": -product.quantity } }
                )
            })
        )

        return res.status(201).json({ success: true, message: "order placed successfully" });


    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const placePaypalOrder = async (req, res) => {

    // handle voucher codes and apply discounts for paypal

    let { paypalOrderID, dbOrderID } = req.body
    paypalOrderID = JSON.parse(paypalOrderID)

    if (!paypalOrderID) return res.status(404).json({ success: false, message: "no paypal order id found" })

    if (paypalOrderID) {

        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(paypalOrderID);
        request.requestBody({});

        // checking if order is already captured (placed)
        const getOrderRequest = new checkoutNodeJssdk.orders.OrdersGetRequest(paypalOrderID)
        const orderDetails = await paypalClient.execute(getOrderRequest)

        if (orderDetails.result.status == "COMPLETED") {
            console.log('already captured')
            return res.status(400).json({ message: "Order already placed" })
        }

        try {
            let order = await Order.findById(dbOrderID)

            const capture = await paypalClient.execute(request);

            if (capture.statusCode == 201 && capture.result.status === "COMPLETED") {
                // changing order status
                order.paymentStatus = "paid"
                order.orderStatus = "processing"
                await order.save()

                console.log("order finally captured sir")
                return res.status(200).json({ success: true, details: capture.result });
            }
            order.orderStatus = "cancelled"
            await order.save()
            console.log("order didn't captured")


            return res.status(500).json({ success: true, details: "something went terribly wrong in order capturing" });
        } catch (err) {
            console.error("error on capture ------------------ ", err);
            return res.status(500).json({ message: 'Could not capture PayPal order' });
        }
    }
    else console.log("no paypal orderID found")

}

export const placeStripeOrder = async (req, res) => {

    if (endpointSecret) {
        const signature = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        } catch (err) {
            console.error("Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle successful checkout
        if (event.type === 'checkout.session.completed') {


            const session = event.data.object;
            const orderId = session.metadata.orderId;
            console.log(2)

            try {
                const order = await Order.findById(orderId);
                if (!order) return res.status(404).send("Order not found");
                const voucherCode = order.voucher.code

                const { items } = order;
                console.log(3)


                // Reduce inventory
                await Promise.all(
                    items.map(async (product) => {
                        await Product.updateOne(
                            { _id: product._id, "variants.color": product.variant.color },
                            { $inc: { "variants.$.quantity": -product.quantity } }
                        );
                    })
                );
                console.log(4)


                // Mark voucher as used
                if (voucherCode && voucherCode !== "") {
                    const voucher = await Voucher.findOne({ code: voucherCode });
                    if (voucher) {
                        voucher.usedBy.push(order.user);
                        await voucher.save();
                    }
                }
                console.log(5)


                // Update order status
                order.paymentStatus = "paid";
                order.orderStatus = "processing";
                await order.save();

                return res.status(200).json({ received: true });

            } catch (err) {
                console.error("Error processing webhook:", err.message);
                return res.status(500).send("Internal Server Error");
            }
        }
        else if (event.type === "checkout.session.async_payment_failed") {
            console.log("your stripe payment failed boy")

            const orderId = event.data.object.metadata.orderId;
            try {
                // await Order.findByIdAndDelete(orderId)
                await Order.findByIdAndUpdate(orderId, { orderStatus: "cancelled" })
                res.status(400).json({ success: false, message: 'Payment failed sire' })
            }
            catch (err) {
                console.log(err)
                res.status(500).json({ success: false, message: err.message })
            }
        }
        else if (event.type === "checkout.session.expired") {
            console.log("your stripe session expired boy")
            const orderId = event.data.object.metadata.orderId;
            try {
                await Order.findByIdAndUpdate(orderId, { orderStatus: "cancelled" })
                res.status(200).json({ success: true, message: 'session expired sire' })
            }
            catch (err) {
                console.log(err)
                res.status(500).json({ success: false, message: err.message })
            }
        }
        else return res.status(400).send("Unhandled event type");
    } else {
        console.log("no endpoint secret")
        res.status(404).json({ success: false, message: "no secret endpoint found" })
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const allOrders = await Order.find({ orderStatus: { $ne: 'cancelled' } }).populate("user")
        res.json({ success: true, allOrders })
    } catch (error) {
        console.log(error.message)
    }
}

export const getAllUserOrders = async (req, res) => {
    try {
        const user = req.user
        if (!user) return res.status(404).json({ success: false, message: "you must be logged in to get your orders" })

        const allOrders = await Order.find({ user: user._id })
        res.status(200).json({ success: true, allOrders })
    } catch (error) {

    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({ success: false, message: "no order found" })

        order.orderStatus = req.body.orderStatus
        await order.save()
        let updatedOrder = await Order.findById(orderId).populate("user")
        res.status(200).json({ success: true, message: "status updated successfully", updatedOrder })

    } catch (error) {
        console.log(error.message)
    }
}

export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({ success: false, message: "no order found" })

        order.orderStatus = "cancelled"
        await order.save()
        res.status(200).json({ success: true, message: "status updated successfully", updatedOrder: order })

    } catch (error) {
        console.log(error.message)
    }
}
