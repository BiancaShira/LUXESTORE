import { 
  products, orders, orderItems, inventoryLogs,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth";

export interface IStorage extends IAuthStorage {
  // Products
  getProducts(category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Orders
  getOrders(userId?: string): Promise<OrderWithItems[]>; // If userId provided, filter by it
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(userId: string, orderData: { paymentMethod: string; total: number }, items: { productId: number; quantity: number; price: number }[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Analytics
  getSalesData(): Promise<{ totalSales: number; count: number }>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods delegated to authStorage
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);

  // Products
  async getProducts(category?: string): Promise<Product[]> {
    if (category) {
      return await db.select().from(products).where(eq(products.category, category));
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(userId?: string): Promise<OrderWithItems[]> {
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));
    
    if (userId) {
      // @ts-ignore
      query = query.where(eq(orders.userId, userId));
    }
    
    const ordersList = await query;
    
    // Fetch items for each order (could be optimized with join, but this is simple)
    const ordersWithItems: OrderWithItems[] = [];
    
    for (const order of ordersList) {
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: products
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));
        
      ordersWithItems.push({
        ...order,
        // @ts-ignore
        items: items.map(item => ({ ...item, product: item.product! }))
      });
    }
    
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      // @ts-ignore
      items: items.map(item => ({ ...item, product: item.product! }))
    };
  }

  async createOrder(userId: string, orderData: { paymentMethod: string; total: number }, items: { productId: number; quantity: number; price: number }[]): Promise<Order> {
    // Start transaction
    return await db.transaction(async (tx) => {
      // Create Order
      const [order] = await tx.insert(orders).values({
        userId,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        status: "paid", // Assume paid for simplicity of mock
        paymentStatus: "paid"
      }).returning();

      // Create Order Items and Update Stock
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });

        // Decrement stock
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          await tx.update(products)
            .set({ stock: product.stock - item.quantity })
            .where(eq(products.id, item.productId));
            
          // Log inventory change
          await tx.insert(inventoryLogs).values({
            productId: item.productId,
            change: -item.quantity,
            reason: `Order #${order.id}`
          });
        }
      }

      return order;
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return order;
  }

  async getSalesData(): Promise<{ totalSales: number; count: number }> {
    const allOrders = await db.select().from(orders).where(eq(orders.status, "paid")); // or delivered
    const totalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
    return { totalSales, count: allOrders.length };
  }
}

export const storage = new DatabaseStorage();
