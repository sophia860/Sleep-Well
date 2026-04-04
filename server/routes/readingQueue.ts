import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { z } from "zod";
import { insertReadingQueueSchema, insertSavedPieceSchema, insertReadingShelfSchema } from "@shared/schema";

export function registerReadingQueueRoutes(app: Express) {
  app.get("/api/reading-queue", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getReadingQueue(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading queue" });
    }
  });

  app.post("/api/reading-queue", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertReadingQueueSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.addToReadingQueue(
        req.user.id,
        parsed.data.writingId,
      );
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to reading queue" });
    }
  });

  app.delete(
    "/api/reading-queue/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.removeFromReadingQueue(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Removed" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove" });
      }
    },
  );

  app.patch(
    "/api/reading-queue/:id/read",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.markQueueItemRead(
          req.user.id,
          req.params.id,
        );
        if (!item) return res.status(404).json({ message: "Not found" });
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to update" });
      }
    },
  );

  app.post("/api/reading-notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schema = z.object({
        sourceWritingId: z.string(),
        sourceTitle: z.string().optional(),
        highlightText: z.string().optional(),
        note: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });

      const { sourceWritingId, sourceTitle, highlightText, note } = parsed.data;

      const contentParts: string[] = [];
      if (highlightText) {
        contentParts.push(`<blockquote><p>${highlightText}</p></blockquote>`);
      }
      contentParts.push(`<p>${note}</p>`);
      if (sourceTitle) {
        contentParts.push(
          `<p><em>— Reading note from "${sourceTitle}"</em></p>`,
        );
      }

      const title = highlightText
        ? `Note: "${highlightText.slice(0, 60)}${highlightText.length > 60 ? "…" : ""}"`
        : `Reading note on "${sourceTitle || "a piece"}"`;

      const writing = await storage.createWriting(userId, {
        title,
        content: contentParts.join("\n"),
        stage: "seed",
        genre: "fragment",
        tags: ["reading-note", `source:${sourceWritingId}`],
      });

      res.status(201).json(writing);
    } catch (error) {
      console.error("Error creating reading note:", error);
      res.status(500).json({ message: "Failed to create reading note" });
    }
  });

  app.get("/api/saved", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getSavedPieces(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved pieces" });
    }
  });

  app.post("/api/saved", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertSavedPieceSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.savePiece(
        req.user.id,
        parsed.data.writingId,
      );
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to save piece" });
    }
  });

  app.delete("/api/saved/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.unsavePiece(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove" });
    }
  });

  app.get("/api/reading-shelf", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getReadingShelf();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading shelf" });
    }
  });

  app.post("/api/reading-shelf", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertReadingShelfSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const entry = await storage.addToReadingShelf(req.user.id, {
        bookTitle: parsed.data.bookTitle,
        author: parsed.data.author ?? undefined,
        reaction: parsed.data.reaction,
      });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to reading shelf" });
    }
  });

}
