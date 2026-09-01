# SaaS E-Commerce Platform

Enterprise-grade SaaS E-Commerce backend built on Node.js, Express 5, and MongoDB. The system provides secure multi-tenant capabilities, automated inventory management, payment orchestration via Stripe and PayPal, sliding-window rate limiting, voucher discount processing, and real-time administrative analytics.

## Key Capabilities & Enhancements

- **Security & Hardening:**
  - Automated sliding-window rate limiting on authentication and API routes.
  - NoSQL injection sanitizer stripping operator queries from requests.
  - Strict HTTP security response headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `CSP`).
  - Server fingerprint masking by disabling `X-Powered-By`.
  - Scoped authorization guards preventing cross-tenant credential modifications.

- **Order & Inventory Management:**
  - Multi-gateway checkout processing supporting Stripe webhooks, PayPal orders, and Cash on Delivery.
  - Real-time stock reservation and automatic restocking upon order cancellation.
  - Public order tracking endpoint using generated tracking numbers.
  - Customer self-service cancellation window for pending orders.

- **Voucher & Discount Engine:**
  - Percentage and flat discount calculations with cart-level validation.
  - Expiry date enforcement and per-user redemption limits.
  - Complete administrative voucher CRUD operations.

- **Product Catalog & Reviews:**
  - Multi-attribute faceted filtering by category, price range, stock availability, and rating.
  - Automatic SKU generation and variant stock aggregation.
  - Verified buyer review enforcement requiring delivered purchase before submission.
  - Dynamic recalculation of average ratings and review counts on change.

- **Analytics & Health Monitoring:**
  - Real-time administrative dashboard summary (revenue, order status breakdown, low-stock alerts).
  - Revenue distribution analysis by product category.
  - Telemetry health check endpoint reporting process uptime, memory usage, and database connection state.

## Architecture & Directory Layout

```
saas-project/
├── backend/
│   ├── cloudinary/         # Cloudinary media upload configuration
│   ├── controllers/        # Business logic controllers
│   │   ├── adminUser.controllers.js
│   │   ├── analytics.controllers.js
│   │   ├── blog.controllers.js
│   │   ├── order.controllers.js
│   │   ├── product.controllers.js
│   │   ├── review.controllers.js
│   │   ├── user.controllers.js
│   │   └── voucher.controllers.js
│   ├── middlewares/        # Custom security and utility middlewares
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── sanitizer.js
│   │   └── securityHeaders.js
│   ├── models/             # Mongoose schemas
│   │   ├── admin.model.js
│   │   ├── blog.model.js
│   │   ├── order.model.js
│   │   ├── product.model.js
│   │   ├── productReview.model.js
│   │   ├── user.model.js
│   │   └── voucher.model.js
│   ├── routes/             # RESTful API route declarations
│   ├── utils/              # ApiError and asyncHandler primitives
│   ├── index.js            # Express server entry point
│   ├── middlewares.js      # JWT authentication and PayPal client
│   └── package.json        # Dependencies and lifecycle scripts
```

## API Endpoint Reference

### System Health
- `GET /api/health` - Health check, uptime, and memory statistics

### Authentication & Users
- `POST /api/user/auth/signup` - Register a new customer
- `POST /api/user/auth/login` - Authenticate customer (rate-limited)
- `GET /api/user/auth/getUser` - Retrieve current user profile
- `PUT /api/user/auth/:userId/update` - Update account password
- `GET /api/user/auth/addresses` - List user shipping addresses
- `POST /api/user/auth/addresses` - Add new shipping address
- `PUT /api/user/auth/addresses/:addressId` - Update shipping address
- `DELETE /api/user/auth/addresses/:addressId` - Delete shipping address

### Products & Inventory
- `GET /api/products` - Filtered, sorted, and paginated product catalog
- `GET /api/products/categories` - Distinct product category list
- `GET /api/products/search` - Multi-field product search
- `GET /api/products/:productId` - Retrieve single product details
- `GET /api/products/:productId/availability` - Real-time stock check
- `POST /api/products/create` - Create product with variant images (Admin)
- `PUT /api/products/:productId/update` - Update product details (Admin)
- `DELETE /api/products/:productId/delete` - Remove product and media (Admin)

### Orders & Checkout
- `POST /api/orders/new` - Create order (Stripe, PayPal, COD)
- `POST /api/orders/webhook` - Stripe payment webhook handler
- `POST /api/orders/capture-paypal-order` - Capture authorized PayPal payment
- `GET /api/orders/track/:trackingNumber` - Track order by public tracking number
- `GET /api/orders/getUserOrders` - List customer orders
- `PATCH /api/orders/:orderId/customer-cancel` - Customer order cancellation
- `GET /api/orders` - Comprehensive order list (Admin)
- `PATCH /api/orders/:orderId/status` - Update order delivery status (Admin)
- `PATCH /api/orders/:orderId/cancel` - Cancel order (Admin)

### Vouchers & Discounts
- `POST /api/vouchers/apply` - Validate and apply voucher discount to cart
- `GET /api/vouchers/all` - List all vouchers with usage counts (Admin)
- `POST /api/vouchers/create` - Create new voucher code (Admin)
- `DELETE /api/vouchers/:voucherId` - Remove voucher (Admin)

### Analytics
- `GET /api/analytics/summary` - Key dashboard metrics and low-stock alerts (Admin)
- `GET /api/analytics/sales-by-category` - Revenue breakdown by category (Admin)

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB 6.0+

### Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` (refer to `.env.example`).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run in production:
   ```bash
   npm start
   ```

## License

This project is licensed under the ISC License.
