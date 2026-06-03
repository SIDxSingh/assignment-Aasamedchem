import { pgTable, uuid, text, timestamp, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // CHECK (role IN ('ADMIN','SELLER'))
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2. Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  description: text('description'),
  category: text('category'),
  baseUnit: text('base_unit').notNull(), // 'g', 'mL', or 'unit'
  basePrice: decimal('base_price', { precision: 20, scale: 6 }).notNull(), // price per 1 base_unit in paise
  stockQuantity: decimal('stock_quantity', { precision: 20, scale: 6 }).default('0').notNull(), // in base_unit
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 3. Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id),
  status: text('status').default('PENDING').notNull(), // CHECK (status IN ('PENDING','CONFIRMED','REJECTED','FULFILLED'))
  totalAmount: decimal('total_amount', { precision: 20, scale: 6 }), // in paise
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 4. Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  orderedUnit: text('ordered_unit').notNull(), // g/kg/mL/L/unit
  orderedQuantity: decimal('ordered_quantity', { precision: 20, scale: 6 }).notNull(),
  baseQuantity: decimal('base_quantity', { precision: 20, scale: 6 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 6 }).notNull(),
});

// Relations for Drizzle queries (optional but makes API writing very elegant)
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
