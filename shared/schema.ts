import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import auth models to export them
export * from "./models/auth";
import { users } from "./models/auth";

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  category: text("category").notNull(), // 'Shoes' | 'Cosmetics'
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });

// === ORDERS ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // references auth users.id implicitly (no FK constraint to avoid complexity with auth module separation, but logically linked)
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'mpesa', 'card'
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

// === ORDER ITEMS ===
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // snapshot price
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// === INVENTORY LOGS ===
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  change: integer("change").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  inventoryLogs: many(inventoryLogs),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  // No direct relation to users table defined here because users is in a separate file, 
  // but we can join manually if needed or just fetch user data separately.
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

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Custom Types for API
export type CreateOrderRequest = {
  items: { productId: number; quantity: number }[];
  paymentMethod: "mpesa" | "card";
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};
