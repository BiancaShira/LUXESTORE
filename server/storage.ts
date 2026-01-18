import { 
  products, orders, orderItems, inventoryLogs, stores,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderWithItems, type Store, type InsertStore
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth";

export interface IStorage extends IAuthStorage {
  // Stores
  getStores(): Promise<Store[]>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  getStoreById(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store>;

  // Products
  getProducts(filters?: { category?: string; storeId?: number }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Orders
  getOrders(filters?: { userId?: string; storeId?: number }): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(userId: string, orderData: { storeId: number; paymentMethod: string; total: number }, items: { productId: number; quantity: number; price: number }[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Analytics
  getSalesData(storeId?: number): Promise<{ totalSales: number; count: number }>;
}

export class DatabaseStorage implements IStorage {
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);

  // Stores
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStoreBySlug(slug: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
    return store;
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db.insert(stores).values(insertStore).returning();
    return store;
  }

  async updateStore(id: number, updates: Partial<InsertStore>): Promise<Store> {
    const [store] = await db.update(stores).set(updates).where(eq(stores.id, id)).returning();
    return store;
  }

  // Products
  async getProducts(filters?: { category?: string; storeId?: number }): Promise<Product[]> {
    let whereClauses = [];
    if (filters?.category) whereClauses.push(eq(products.category, filters.category));
    if (filters?.storeId) whereClauses.push(eq(products.storeId, filters.storeId));
    
    if (whereClauses.length > 0) {
      return await db.select().from(products).where(and(...whereClauses));
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
  async getOrders(filters?: { userId?: string; storeId?: number }): Promise<OrderWithItems[]> {
    let whereClauses = [];
    if (filters?.userId) whereClauses.push(eq(orders.userId, filters.userId));
    if (filters?.storeId) whereClauses.push(eq(orders.storeId, filters.storeId));
    
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));
    if (whereClauses.length > 0) {
      // @ts-ignore
      query = query.where(and(...whereClauses));
    }
    
    const ordersList = await query;
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

  async createOrder(userId: string, orderData: { storeId: number; paymentMethod: string; total: number }, items: { productId: number; quantity: number; price: number }[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        userId,
        storeId: orderData.storeId,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        status: "paid",
        paymentStatus: "paid"
      }).returning();

      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });

        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          await tx.update(products)
            .set({ stock: product.stock - item.quantity })
            .where(eq(products.id, item.productId));
            
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

  async getSalesData(storeId?: number): Promise<{ totalSales: number; count: number }> {
    let query = db.select().from(orders).where(eq(orders.status, "paid"));
    if (storeId) {
      // @ts-ignore
      query = query.where(eq(orders.storeId, storeId));
    }
    const allOrders = await query;
    const totalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
    return { totalSales, count: allOrders.length };
  }
}

export const storage = new DatabaseStorage();
