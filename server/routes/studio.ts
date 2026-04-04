import type { Express } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { exhibits } from "@shared/schema";

export function registerStudioRoutes(app: Express) {
  app.get("/api/studio/products", async (_req, res) => {
    try {
      const products = await db
        .select()
        .from(exhibits)
        .where(eq(exhibits.isPublished, true))
        .orderBy(exhibits.slug);
      res.json(products);
    } catch (error) {
      console.error("Studio products error:", error);
      res.status(500).json({ message: "Failed to fetch studio products" });
    }
  });

  app.get("/api/studio/products/:slug", async (req, res) => {
    try {
      const [product] = await db
        .select()
        .from(exhibits)
        .where(
          and(
            eq(exhibits.slug, req.params.slug),
            eq(exhibits.isPublished, true)
          )
        )
        .limit(1);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      console.error("Studio product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

}
