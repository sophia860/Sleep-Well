import type { Express } from "express";
import { storage } from "../storage";

export function registerCommunityRoutes(app: Express) {
  app.get("/api/community/live-counts", async (req, res) => {
    try {
      const counts = await storage.getLivePromptCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching live counts:", error);
      res.status(500).json({ message: "Failed to fetch live counts" });
    }
  });

}
