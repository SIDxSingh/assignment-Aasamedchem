# AasaMedChem Inventory & Order Management System

**Live Demo URL**: [https://assignment-aasamedchem.vercel.app]
A production-ready, enterprise-grade Inventory and Order Management System designed with real-time stock levels, dynamic unit conversions, and secure role-based authorization.

---

## 🚀 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM (Selected for serverless http connection pooling, type safety, and SQL-like transaction syntax)
- **Auth**: NextAuth.js v5 (auth.js) with JWT strategy and credentials provider
- **Styling**: Tailwind CSS + Shadcn-style components
- **Language**: TypeScript

---

## 🏛️ System Design Diagram

```
                 +--------------------------------------------------------+
                 |                      Client Browser                    |
                 +---------------------------+----------------------------+
                                             |
                                    (HTTPS, NextAuth v5)
                                             |
                                             v
                 +--------------------------------------------------------+
                 |                 Next.js 14 App Router                  |
                 +---------------------------+----------------------------+
                                             |
                     +-----------------------+-----------------------+
                     | (ADMIN Route)                                 | (SELLER Route)
                     v                                               v
        +--------------------------+                    +--------------------------+
        |     Admin Dashboard      |                    |      Seller Browse       |
        |  - Metrics summary cards |                    |  - Search & category filter|
        |  - Low stock warning     |                    |  - Unit config selectors |
        |  - Revenue calculation   |                    |  - Live price preview    |
        +------------+-------------+                    +------------+-------------+
                     |                                               |
                     | (CRUD API)                                    | (Order Submission)
                     v                                               v
        +--------------------------+                    +--------------------------+
        |    Product & Order       |                    |       Shopping Cart      |
        |     Administration       |                    |  - Requisition notes     |
        |  - Scaled price view     |                    |  - LocalStorage backup   |
        |  - Rejection stock revert|                    |  - Checkout execution    |
        +------------+-------------+                    +------------+-------------+
                     |                                               |
                     +-----------------------+-----------------------+
                                             |
                                      (Drizzle client)
                                             |
                                             v
                               +----------------------------+
                               |     Neon Serverless DB     |
                               |  - Users, Products,        |
                               |    Orders, Order Items     |
                               +----------------------------+
```

---

## 🗄️ Database Schema & Reasoning

We utilize **PostgreSQL** on Neon Serverless. To ensure absolute numeric accuracy and avoid floating-point rounding errors (which are critical in commercial financial and stock systems), we store all prices and quantities using `NUMERIC(20,6)`.

### 1. `users`
Represents the system users and their access roles.
- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `name` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL: Hashed password using bcrypt.
- `role` TEXT NOT NULL CHECK (`role` IN ('ADMIN', 'SELLER')): Role-based restriction.
- `created_at` TIMESTAMPTZ DEFAULT `now()`

### 2. `products`
Holds catalog products and their stock levels.
- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `name` TEXT NOT NULL
- `sku` TEXT UNIQUE: Short identifier.
- `description` TEXT
- `category` TEXT
- `base_unit` TEXT NOT NULL: Can be `g` (weight), `mL` (volume), or `unit` (count).
- `base_price` NUMERIC(20,6) NOT NULL: Price of **1 base_unit** stored in **paise** (1 INR = 100 paise).
- `stock_quantity` NUMERIC(20,6) NOT NULL DEFAULT 0: Available quantity in **base_unit**.
- `is_active` BOOLEAN DEFAULT true: Soft-delete column.
- `created_at` TIMESTAMPTZ DEFAULT `now()`
- `updated_at` TIMESTAMPTZ DEFAULT `now()`

### 3. `orders`
Header table for client orders.
- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `seller_id` UUID REFERENCES `users(id)`: Identifies the seller that created the requisition.
- `status` TEXT DEFAULT 'PENDING' CHECK (`status` IN ('PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED'))
- `total_amount` NUMERIC(20,6): Accumulation of item totals in **paise**.
- `notes` TEXT: Special instructions.
- `created_at` TIMESTAMPTZ DEFAULT `now()`
- `updated_at` TIMESTAMPTZ DEFAULT `now()`

### 4. `order_items`
Details table representing individual line-items inside an order.
- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `order_id` UUID REFERENCES `orders(id)` ON DELETE CASCADE
- `product_id` UUID REFERENCES `products(id)`
- `ordered_unit` TEXT NOT NULL: Unit chosen by the seller (e.g., `kg`, `L`, `unit`).
- `ordered_quantity` NUMERIC(20,6) NOT NULL: Quantity in the chosen unit.
- `base_quantity` NUMERIC(20,6) NOT NULL: Converted base quantity (`ordered_quantity * conversionFactor`) stored for stock operations.
- `unit_price` NUMERIC(20,6) NOT NULL: Price per `ordered_unit` at the time of order placement.
- `line_total` NUMERIC(20,6) NOT NULL: Line item cost in paise (`ordered_quantity * unit_price`).

---

## ⚖️ Unit Conversion Strategy

We support conversions within weight and volume dimensions. Count dimensions do not convert and only support the base unit.

### Supported Conversions
- **Weight**: Base `g`, conversion unit `kg` ($1\text{ kg} = 1000\text{ g}$)
- **Volume**: Base `mL`, conversion unit `L` ($1\text{ L} = 1000\text{ mL}$)
- **Count**: Base `unit` only

### Mathematical Formulas
The conversion factors are managed inside `src/lib/units.ts`:
- **Quantity to Base Unit**: `baseQuantity = orderedQuantity * conversionFactor`
- **Quantity from Base Unit**: `displayQuantity = baseQuantity / conversionFactor`
- **Pricing scale**: `unitPrice = basePricePerBaseUnit * conversionFactor`
- **Rupee formatting**: `rupees = paise / 100`

> **Note on Price Storage**: Prices are stored in **INR Paise** as `NUMERIC(20,6)` internally. They are converted to Rupees ($\text{Rupees} = \text{Paise} / 100$) before being formatted for client display (e.g. `₹1,234.56`).

---

## 🛠️ Local Setup Instructions

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="postgres://your_neon_username:your_neon_password@your_neon_hostname/dbname?sslmode=require"
NEXTAUTH_SECRET="a_long_random_jwt_secret_string"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Seed Database
Recreate the tables and populate users, products, and orders:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🚀 Vercel Deployment Steps

1. Install Vercel CLI or connect through the Vercel dashboard.
2. Link your Git repository.
3. Configure the environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (points to production domain, e.g. `https://your-app.vercel.app`)
4. Deploy the application. The project builds automatically.

---

## 🔑 Test Login Credentials
- **Admin**: `siddharthwizard123@gmail.com` / `Sid@2003`
- **Seller**: `sidsez@gmail.com` / `Sid@2003`

---

## 🖥️ User Panel Workflows

### Admin Panel (`/admin/*`)
1. **Dashboard**: Access `/admin/dashboard` to view statistics on products count, low stock warnings, pending approvals, and total revenue.
2. **Products CRUD**: Access `/admin/products` to create new products. Enter prices in ₹, which the API automatically converts to paise. Toggle edit details, or press delete to soft-delete items (sets `isActive=false`). View scaled unit pricing for compatible dimensions.
3. **Order Approvals**: Go to `/admin/orders` to see all orders. Click on any row to expand details, inspect the conversions applied to each line item, and click **Confirm**, **Reject**, or **Fulfill**. Rejecting an order automatically rolls back the allocated inventory to the products table.

### Seller Panel (`/seller/*`)
1. **Product Browsing**: Access `/seller/products` to search items or filter by category and dimension. Configure custom units (e.g. `kg` or `L`) and quantities on any product card, watch the live total price estimate update, and click **Add to Cart**.
2. **Shopping Cart**: Go to `/seller/cart` to inspect added items. Edit quantities inside the input table or remove rows. Write custom requisition notes, and click **Place Order** to deduct inventory and submit the request.
3. **Orders History**: View the status of placed requisitions (Pending, Confirmed, Fulfilled, Rejected) at `/seller/orders` with full expandable breakdown.

