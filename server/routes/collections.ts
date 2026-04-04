import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { insertChapbookCollectionSchema, updateChapbookCollectionSchema, insertCollectionItemSchema, chapbookCollections, collectionItems, collectionUnlocks } from "@shared/schema";

export function registerCollectionsRoutes(app: Express) {
  app.post("/api/collections", isAuthenticated, async (req, res) => {
    try {
      const data = insertChapbookCollectionSchema.parse(req.body);
      const [collection] = await db
        .insert(chapbookCollections)
        .values({ ...data, authorId: req.user!.id })
        .returning();
      res.json(collection);
    } catch (error) {
      console.error("Create collection error:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.get("/api/collections", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const collections = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.authorId, req.user!.id));
      res.json(collections);
    } catch (error) {
      console.error("Fetch collections error:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;
      const [collection] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // Check access: public OR logged-in author OR reader who unlocked
      let canView = collection.isPublic;
      if (req.user) {
        if (req.user.id === collection.authorId) {
          canView = true;
        } else if (collection.allowTip) {
          const unlocks = await db
            .select()
            .from(collectionUnlocks)
                      .where(and(
            eq(collectionUnlocks.collectionId, id),
            eq(collectionUnlocks.readerId, req.user.id)
          ));
          if (unlocks.length > 0) {
            canView = true;
          }
        }
      }

      if (!canView) {
        return res.status(403).json({ message: "Collection is private or requires unlock" });
      }

      // Fetch items
      const items = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, String(id)))
        .orderBy(collectionItems.sortOrder);

      res.json({ collection, items });
    } catch (error) {
      console.error("Fetch collection error:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.patch("/api/collections/:id", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;
      const data = updateChapbookCollectionSchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!existing || existing.authorId !== req.user!.id) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const [updated] = await db
        .update(chapbookCollections)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(chapbookCollections.id, String(id)))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Update collection error:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;

      const [existing] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!existing || existing.authorId !== req.user!.id) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // Delete items first
      await db.delete(collectionItems).where(eq(collectionItems.collectionId, String(id)));
      // Delete unlocks
            await db.delete(collectionUnlocks).where(eq(collectionUnlocks.collectionId, String(id)));
      // Delete collection
      await db.delete(chapbookCollections).where(eq(chapbookCollections.id, String(id)));

      res.json({ message: "Collection deleted" });
    } catch (error) {
      console.error("Delete collection error:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post("/api/collections/:id/items", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;
      const data = insertCollectionItemSchema.parse(req.body);

      const [collection] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!collection || collection.authorId !== req.user!.id) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const [item] = await db
        .insert(collectionItems)
        .values({ ...data, collectionId: String(id) })
        .returning();

      res.json(item);
    } catch (error) {
      console.error("Add item error:", error);
      res.status(500).json({ message: "Failed to add item to collection" });
    }
  });

  app.delete("/api/collections/:id/items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id, itemId } = req.params;

      const [collection] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!collection || collection.authorId !== req.user!.id) {
        return res.status(404).json({ message: "Collection not found" });
      }

      await db.delete(collectionItems).where(eq(collectionItems.id, String(itemId)));
      res.json({ message: "Item removed" });
    } catch (error) {
      console.error("Remove item error:", error);
      res.status(500).json({ message: "Failed to remove item" });
    }
  });

  app.post("/api/collections/:id/unlock", isAuthenticated, async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;
      const { paypalOrderId, amountPaidPence } = req.body;

      // Check collection exists
      const [collection] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // Check if already unlocked
      const existing = await db
        .select()
        .from(collectionUnlocks)
          .where(and(
            eq(collectionUnlocks.collectionId, String(id)),
            eq(collectionUnlocks.readerId, req.user!.id)
          ));
      if (existing.length > 0) {
        return res.json({ message: "Already unlocked" });
      }

      // Record unlock
      const [unlock] = await db
        .insert(collectionUnlocks)
        .values({
          collectionId: String(id),
          readerId: req.user!.id,
          paypalOrderId,
          amountPaidPence: amountPaidPence || collection.tipAmountPence,
        })
        .returning();

      res.json(unlock);
    } catch (error) {
      console.error("Unlock collection error:", error);
      res.status(500).json({ message: "Failed to unlock collection" });
    }
  });

  app.get("/api/collections/:id/share", async (req, res) => {
    try {
      const { eq } = await import("drizzle-orm");
      const { id } = req.params;
      const [collection] = await db
        .select()
        .from(chapbookCollections)
        .where(eq(chapbookCollections.id, String(id)));

      if (!collection || !collection.isPublic) {
        return res.status(404).json({ message: "Collection not found or not public" });
      }

      const shareUrl = `/collections/${collection.shareSlug || collection.id}`;
      res.json({ shareUrl });
    } catch (error) {
      console.error("Get share link error:", error);
      res.status(500).json({ message: "Failed to generate share link" });
    }
  });

}
