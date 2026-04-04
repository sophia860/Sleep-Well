import type { Express } from "express";
import { db } from "../db";

export function registerNewsletterRoutes(app: Express) {
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email required" });
      }
      const db = await import("../db");
      await db.pool.query(
        `INSERT INTO newsletter_subscribers (email, subscribed_at)
         VALUES ($1, NOW())
         ON CONFLICT (email) DO NOTHING`,
        [email.toLowerCase().trim()]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

}
