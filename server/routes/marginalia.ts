import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerMarginaliaRoutes(app: Express) {
  app.get(
    "/api/marginalia/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const items = await storage.getMarginaliaForWriting(
          req.params.writingId,
          userId,
        );
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch marginalia" });
      }
    },
  );

  app.post("/api/marginalia", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId, content, parentId, highlightText } = req.body;
      if (!writingId || !content)
        return res
          .status(400)
          .json({ message: "writingId and content are required" });
      const result = await storage.createMarginalia(req.user.id, {
        writingId,
        content,
        parentId,
        highlightText,
      });
      const writing = await storage.getWriting(writingId);
      if (writing && writing.authorId !== req.user.id) {
        await storage.createNotification(writing.authorId, {
          type: "marginalia",
          actorId: req.user.id,
          writingId,
          message: `left a note on "${writing.title || "Untitled"}"`,
        });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to create marginalia" });
    }
  });

  app.delete("/api/marginalia/:id", isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.deleteMarginalia(
        req.user.id,
        req.params.id,
      );
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.patch(
    "/api/marginalia/:id/surface",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.surfaceMarginalia(
          req.user.id,
          req.params.id,
        );
        if (!result)
          return res
            .status(404)
            .json({ message: "Not found or not authorized" });
        res.json({ message: "Surfaced" });
      } catch (error) {
        res.status(500).json({ message: "Failed to surface marginalia" });
      }
    },
  );

  app.patch(
    "/api/marginalia/:id/unsurface",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.unsurfaceMarginalia(
          req.user.id,
          req.params.id,
        );
        if (!result)
          return res
            .status(404)
            .json({ message: "Not found or not authorized" });
        res.json({ message: "Unsurfaced" });
      } catch (error) {
        res.status(500).json({ message: "Failed to unsurface marginalia" });
      }
    },
  );

}
