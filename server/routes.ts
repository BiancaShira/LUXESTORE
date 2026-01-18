import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ================= STORES =================

  app.get(api.stores.list.path, async (_req, res) => {
    const stores = await storage.getStores();
    res.json(stores);
  });

  app.get(api.stores.get.path, async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store || !store.isActive) {
      return res
        .status(404)
        .json({ message: "Store not found or inactive" });
    }
    res.json(store);
  });

  app.post(api.stores.create.path, async (req, res) => {
    try {
      const input = api.stores.create.input.parse(req.body);
      const store = await storage.createStore(input);
      res.status(201).json(store);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.stores.update.path, async (req, res) => {
    try {
      const input = api.stores.update.input.parse(req.body);
      const store = await storage.updateStore(
        Number(req.params.id),
        input
      );

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      res.json(store);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ================= PRODUCTS =================

  app.get(api.products.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const storeId = req.query.storeId
      ? Number(req.query.storeId)
      : undefined;

    const products = await storage.getProducts({ category, storeId });
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(
        Number(req.params.id),
        input
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // ================= ORDERS =================

  app.get(api.orders.list.path, async (_req, res) => {
    const storeId = _req.query.storeId
      ? Number(_req.query.storeId)
      : undefined;

    const orders = await storage.getOrders({ storeId });
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);

      let total = 0;
      const itemsToInsert: any[] = [];

      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        total += product.price * item.quantity;
        itemsToInsert.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });
      }

      const order = await storage.createOrder(
        "local-user", // TEMP USER ID
        {
          storeId: input.storeId,
          paymentMethod: input.paymentMethod,
          total,
        },
        itemsToInsert
      );

      res.status(201).json(order);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: err.message });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(
        Number(req.params.id),
        input.status
      );
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ================= ANALYTICS =================

  app.get(api.analytics.sales.path, async (_req, res) => {
    const storeId = _req.query.storeId
      ? Number(_req.query.storeId)
      : undefined;

    const data = await storage.getSalesData(storeId);
    res.json({ ...data, byCategory: [] });
  });

  // ================= SEED DATA =================

  await seedDatabase();

  return httpServer;
}

// =====================================================
// SEED DATABASE
// =====================================================

async function seedDatabase() {
  const allStores = await storage.getStores();

  if (allStores.length === 0) {
    console.log("Seeding stores...");

    const store1 = await storage.createStore({
      name: "Main Shoes",
      slug: "shoes",
      color: "#2563eb",
      isActive: true,
    });

    const store2 = await storage.createStore({
      name: "Glow Cosmetics",
      slug: "cosmetics",
      color: "#db2777",
      isActive: true,
    });

    console.log("Seeding products...");

    await storage.createProduct({
      storeId: store1.id,
      name: "Classic Leather Sneakers",
      description: "Premium white leather sneakers.",
      price: 8500,
      category: "Shoes",
      stock: 50,
      imageUrl:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772",
    });

    await storage.createProduct({
      storeId: store2.id,
      name: "Matte Lipstick - Ruby Red",
      description: "Long-lasting matte lipstick.",
      price: 2500,
      category: "Cosmetics",
      stock: 100,
      imageUrl:
        "https://images.unsplash.com/photo-1586495777744-4413f21062dc",
    });

    console.log("Database seeded successfully!");
  }
}
