import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === PRODUCTS ===
  app.get(api.products.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const products = await storage.getProducts(category);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    // TODO: Add admin check here
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // === ORDERS ===
  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    // If admin (check email or role), show all. Else show user's.
    // For now, let's just return all for simplicity if "admin", else user's.
    // Mock admin check:
    const user = req.user as any;
    // @ts-ignore
    const isAdmin = user?.email?.includes("admin") || false; 

    if (isAdmin) {
      const orders = await storage.getOrders();
      res.json(orders);
    } else {
      // @ts-ignore
      const orders = await storage.getOrders(user.claims.sub);
      res.json(orders);
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const input = api.orders.create.input.parse(req.body);
      const user = req.user as any;
      const userId = user.claims.sub;

      // 1. Calculate Total & Validate Stock
      let total = 0;
      const itemsToInsert = [];

      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        
        total += product.price * item.quantity;
        itemsToInsert.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      }

      // 2. Mock Payment (M-Pesa / Card)
      // In a real app, we'd call external API here.
      // We'll simulate a random success/failure or delay.
      const isPaymentSuccess = true; // Mock success
      if (!isPaymentSuccess) throw new Error("Payment failed");

      // 3. Create Order
      const order = await storage.createOrder(userId, {
        paymentMethod: input.paymentMethod,
        total
      }, itemsToInsert);

      // 4. Send SMS/Email (Mock)
      console.log(`Sending SMS to user... Order #${order.id} confirmed.`);
      console.log(`Sending Email to user... Order #${order.id} receipt.`);

      res.status(201).json(order);

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: err.message || "Order creation failed" });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(Number(req.params.id), input.status);
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // === ANALYTICS ===
  app.get(api.analytics.sales.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const data = await storage.getSalesData();
    res.json({ ...data, byCategory: [] }); // TODO: implement byCategory if needed
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    console.log("Seeding database...");
    await storage.createProduct({
      name: "Classic Leather Sneakers",
      description: "Premium white leather sneakers suitable for all occasions.",
      price: 8500, // $85.00
      category: "Shoes",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"
    });
    await storage.createProduct({
      name: "Running Performance Shoes",
      description: "Lightweight running shoes with advanced cushioning.",
      price: 12000, // $120.00
      category: "Shoes",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
    });
    await storage.createProduct({
      name: "Matte Lipstick - Ruby Red",
      description: "Long-lasting matte lipstick in a classic red shade.",
      price: 2500, // $25.00
      category: "Cosmetics",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062dc?auto=format&fit=crop&w=800&q=80"
    });
    await storage.createProduct({
      name: "Hydrating Face Serum",
      description: "Vitamin C enriched serum for glowing skin.",
      price: 4500, // $45.00
      category: "Cosmetics",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
    });
    console.log("Database seeded!");
  }
}
