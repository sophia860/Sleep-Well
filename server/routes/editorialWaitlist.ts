import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { insertEditorialWaitlistSchema, editorialWaitlist } from "@shared/schema";

export function registerEditorialWaitlistRoutes(app: Express) {
  app.post("/api/editorial-waitlist", async (req: any, res) => {
    try {
      const data = insertEditorialWaitlistSchema.parse(req.body);
      const [entry] = await db.insert(editorialWaitlist).values(data).returning();
      res.json(entry);
    } catch (error: any) {
      if (error?.code === "23505") {
        res.status(409).json({ message: "duplicate" });
      } else {
        console.error("Editorial waitlist error:", error);
        res.status(400).json({ message: error?.message || "Invalid data" });
      }
    }
  });

  app.get("/api/editorial-waitlist", isAuthenticated, async (req: any, res) => {
    if (req.user?.email !== "sophiamaybea@gmail.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const entries = await db.select().from(editorialWaitlist).orderBy(desc(editorialWaitlist.createdAt));
      res.json(entries);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  app.patch("/api/editorial-waitlist/:id", isAuthenticated, async (req: any, res) => {
    if (req.user?.email !== "sophiamaybea@gmail.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const { id } = req.params;
      const [updated] = await db.update(editorialWaitlist)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(editorialWaitlist.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating waitlist entry:", error);
      res.status(500).json({ message: "Failed to update" });
    }
  });

  app.get("/api/editorial-waitlist/payment/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      const [entry] = await db.select().from(editorialWaitlist).where(eq(editorialWaitlist.paymentToken, token));
      if (!entry) return res.status(404).json({ error: "Invalid or expired payment link." });
      if (entry.status !== "invited") return res.status(400).json({ error: "This payment link is no longer valid." });
      res.json({ id: entry.id, quotedPrice: entry.quotedPrice, status: entry.status, paypalClientId: process.env.PAYPAL_CLIENT_ID });
    } catch (error) {
      console.error("Payment token lookup error:", error);
      res.status(500).json({ error: "Failed to load payment details." });
    }
  });

}
