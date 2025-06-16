// // to enable stripe payment method
// // make a stripe session and provide it with all the details in backend
// // send its session.id to frontend
// // in frontend, use stripe.redirectToCheckout({id: data.sessionId}) // this will take us to stripe payment gateway where we enter our card details

// // create a webhook endpoint on stripe using stripe cli for localhost or directly from the stripe dashboard if the server is live and not on localhost.
// // create a different route that will call this webhook (path) and further logic in it.



// export const placeOrder = async (req, res) => {
//     try {

//         const user = req.user;
//         if (!user) return res.status(401).json({ success: false, message: "You must be logged in to place order" });


//         const orderData = req.body;

//         let { cart, ...otherOrderDetails } = orderData;
//         cart = JSON.parse(cart);

//         // calculating each item's totalPriceAfterDiscount * item.quantity

//         cart = cart.map(item => {
//             let discountAmount = (item.discount * item.price) / 100

//             const discountedPrice = item.price - discountAmount;
//             const totalPriceAfterDiscount = discountedPrice * item.quantity;

//             return {
//                 ...item,
//                 totalPriceAfterDiscount,
//             };
//         });

//         const requiredFields = ["paymentMethod", "firstName", "lastName", "address", "phone", "zipCode"];
//         for (const field of requiredFields) {
//             if (!otherOrderDetails[field]) {
//                 console.log(`line 33 -Field '${field}' is required`)
//                 return res.status(400).json({ success: false, message: `Field '${field}' is required` });
//             }
//         }
//         // Validate cart items
//         const validCartItems = await Promise.all(
//             cart.map(async (product) => {
//                 const checkProduct = await Product.findById(product._id);

//                 if (!checkProduct || checkProduct.price !== product.price || checkProduct.discount !== product.discount) return null;

//                 const matchedVariant = checkProduct.variants.find((variant) => {
//                     if (variant.color !== product.variant.color) return false;

//                     if ((variant.sizes || []).length > 0) {
//                         return variant.sizes.includes(product.variant.size);
//                     }
//                     return true;
//                 });

//                 if (!matchedVariant || matchedVariant.quantity < product.quantity) {
//                     return null;
//                 }
//                 return product;
//             })
//         );



//         const cartItemsToOrder = validCartItems.filter(Boolean);


//         if (cartItemsToOrder.length === 0) {
//             console.log("line 66 - no valid products in cart")
//             return res.status(400).json({ success: false, message: "No valid products in cart" });
//         }

//         const { voucherCode } = otherOrderDetails
//         const validVoucherCode = await Voucher.findOne({ code: voucherCode })



//         // Calculate total price
//         let totalPrice = cartItemsToOrder.reduce((acc, elem) => {
//             let pricePerItem = elem.price;
//             if (elem.discount) {
//                 pricePerItem -= (elem.discount * elem.price) / 100;
//             }
//             return acc + pricePerItem * elem.quantity;
//         }, 0);

//         // applying voucher
//         let voucherDiscountVal = 0
//         if (validVoucherCode && (validVoucherCode.usedBy || []).length < validVoucherCode.usageLimit) {
//             if (validVoucherCode.discountType == "percentage") {
//                 voucherDiscountVal = (totalPrice * validVoucherCode.discountValue) / 100
//                 totalPrice = totalPrice - [(totalPrice * validVoucherCode.discountValue) / 100]
//             }
//             else if (validVoucherCode.discountType == "flat") {
//                 voucherDiscountVal = validVoucherCode.discountValue
//                 totalPrice = totalPrice - validVoucherCode.discountValue
//             }
//             validVoucherCode.usedBy.push(user._id)
//         }


//         const trackingCount = await Order.countDocuments();
//         const trackingNumber = String(trackingCount + 1).padStart(4, '0')

//         const newOrder = new Order({
//             user: user._id,
//             totalPrice,
//             paymentMethod: otherOrderDetails.paymentMethod,
//             items: cartItemsToOrder,
//             orderStatus: "processing",
//             voucher: {
//                 code: validVoucherCode ? validVoucherCode.code : "",
//                 discountType: validVoucherCode ? validVoucherCode.discountType : "percentage",
//                 discountValue: voucherDiscountVal || 0,
//             },
//             comment: otherOrderDetails.comment,
//             trackingNumber,
//             deliveryInfo: {
//                 address: otherOrderDetails.address,
//                 apartment: otherOrderDetails.apartment,
//                 city: otherOrderDetails.city,
//                 phone: otherOrderDetails.phone
//             }
//         });

//         // stripe setup

//         let stripe
//         let session
//         if (otherOrderDetails.paymentMethod == "stripe") {

//             stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

//             session = await stripe.checkout.sessions.create({
//                 payment_method_types: ['card'],
//                 mode: "payment",

//                 line_items: cartItemsToOrder.map((product) => ({
//                     price_data: {
//                         currency: "usd",
//                         product_data: {
//                             name: product.title,
//                             images: [product.variant.image],
//                         },
//                         unit_amount: Math.round(product.totalPriceAfterDiscount * 100), // stripe takes the minimum unit of price according to currency, in usd, cent is the smallest unit as (100 cents == 1 dollar)
//                     },
//                     quantity: product.quantity,
//                 })),
//                 success_url: "http://localhost:5173/shop",
//                 cancel_url: "http://localhost:5173/checkout",
//             })
//         }



//         // order saved in database
//         // redirecting to checkout
//         //  if payment success - fine
//         // if payment unsuccessful - the order is already saved in database. problem

//         // updating the availableQuantity of the products after order is successful
//         await newOrder.save();

//         await Promise.all(
//             cartItemsToOrder.map(async (product) => {
//                 s
//                 await Product.updateOne(
//                     { _id: product._id, "variants.color": product.variant.color },
//                     { $inc: { "variants.$.quantity": -product.quantity } }
//                 )
//             })
//         )
//         if (validVoucherCode) await validVoucherCode.save()


//         return res.status(201).json({ success: true, sessionId: session.id, message: "Order placed successfully" });

//     } catch (error) {
//         console.log(error.message);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };
