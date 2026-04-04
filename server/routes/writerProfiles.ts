import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerWriterProfilesRoutes(app: Express) {
  app.get("/api/credits", isAuthenticated, async (req: any, res) => {
    try {
      const credits = await storage.getPublicationCredits(req.user.id);
      res.json(credits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  app.get("/api/credits/reversions", isAuthenticated, async (req: any, res) => {
    try {
      const reversions = await storage.getUpcomingReversions(
        req.user.id,
      );
      res.json(reversions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reversions" });
    }
  });

  app.post("/api/credits", isAuthenticated, async (req: any, res) => {
    try {
      const credit = await storage.createPublicationCredit(
        req.user.id,
        req.body,
      );
      res.json(credit);
    } catch (error) {
      res.status(500).json({ message: "Failed to create credit" });
    }
  });

  app.patch("/api/credits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const credit = await storage.updatePublicationCredit(
        req.params.id,
        req.user.id,
        req.body,
      );
      if (!credit) return res.status(404).json({ message: "Credit not found" });
      res.json(credit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update credit" });
    }
  });

  app.delete("/api/credits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deletePublicationCredit(
        req.params.id,
        req.user.id,
      );
      if (!deleted)
        return res.status(404).json({ message: "Credit not found" });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete credit" });
    }
  });

  app.get("/api/cover-letters", isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getCoverLetterTemplates(
        req.user.id,
      );
      res.json(templates);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch cover letter templates" });
    }
  });

  app.post("/api/cover-letters", isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.createCoverLetterTemplate(
        req.user.id,
        req.body,
      );
      res.json(template);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to create cover letter template" });
    }
  });

  app.patch(
    "/api/cover-letters/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const template = await storage.updateCoverLetterTemplate(
          req.params.id,
          req.user.id,
          req.body,
        );
        if (!template)
          return res.status(404).json({ message: "Template not found" });
        res.json(template);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to update cover letter template" });
      }
    },
  );

  app.delete(
    "/api/cover-letters/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteCoverLetterTemplate(
          req.params.id,
          req.user.id,
        );
        if (!deleted)
          return res.status(404).json({ message: "Template not found" });
        res.json({ ok: true });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete cover letter template" });
      }
    },
  );

  app.get("/api/writer-bio", isAuthenticated, async (req: any, res) => {
    try {
      const bio = await storage.getWriterBio(req.user.id);
      res.json(bio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch writer bio" });
    }
  });

  app.put("/api/writer-bio", isAuthenticated, async (req: any, res) => {
    try {
      const bio = await storage.upsertWriterBio(req.user.id, req.body);
      res.json(bio);
    } catch (error) {
      res.status(500).json({ message: "Failed to update writer bio" });
    }
  });

  app.get("/api/writing-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getWritingAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch writing analytics" });
    }
  });

}
