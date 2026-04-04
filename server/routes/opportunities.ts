import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertRejectionWallSchema, insertOpportunitySchema, insertOpportunityNoteSchema } from "@shared/schema";

export function registerOpportunitiesRoutes(app: Express) {
  app.get("/api/curated-opportunities", async (req, res) => {
    try {
      const items = await storage.getCuratedOpportunities();
      res.json(items);
    } catch (error) {
      console.error("Failed to get curated opportunities:", error);
      res.status(500).json({ message: "Failed to get curated opportunities" });
    }
  });

  app.get("/api/rejection-wall", async (req: any, res) => {
    try {
      const items = await storage.getRejectionWallEntries();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rejection wall entries" });
    }
  });

  app.post("/api/rejection-wall", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertRejectionWallSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const item = await storage.createRejectionWallEntry(
        req.user.id,
        parsed.data,
      );
      res.status(201).json(item);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to create rejection wall entry" });
    }
  });

  app.delete(
    "/api/rejection-wall/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteRejectionWallEntry(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete rejection wall entry" });
      }
    },
  );

  app.get("/api/opportunities", async (req: any, res) => {
    try {
      const items = await storage.getOpportunities();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get opportunities" });
    }
  });

  app.post("/api/opportunities", async (req: any, res) => {
    try {
      const parsed = insertOpportunitySchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const item = await storage.createOpportunity(req.user.id, {
        title: parsed.data.title,
        link: parsed.data.link ?? undefined,
        outlet: parsed.data.outlet ?? undefined,
        deadline: parsed.data.deadline ?? undefined,
        payRate: parsed.data.payRate ?? undefined,
        responseTime: parsed.data.responseTime ?? undefined,
        vibe: parsed.data.vibe ?? undefined,
        genres: parsed.data.genres ?? undefined,
        notes: parsed.data.notes ?? undefined,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.delete(
    "/api/opportunities/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteOpportunity(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete opportunity" });
      }
    },
  );

  app.get(
    "/api/opportunities/:id/notes",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const notes = await storage.getOpportunityNotes(req.params.id);
        res.json(notes);
      } catch (error) {
        res.status(500).json({ message: "Failed to get notes" });
      }
    },
  );

  app.post(
    "/api/opportunities/:id/notes",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertOpportunityNoteSchema.safeParse({
          ...req.body,
          opportunityId: req.params.id,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const note = await storage.createOpportunityNote(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(note);
      } catch (error) {
        res.status(500).json({ message: "Failed to create note" });
      }
    },
  );

  app.get(
    "/api/opportunity-tracker",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getOpportunityTrackerItems(
          req.user.id,
        );
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch tracker items" });
      }
    },
  );

  app.post(
    "/api/opportunity-tracker",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { opportunityId, status, notes } = req.body;
        if (!opportunityId || !status)
          return res.status(400).json({ message: "Missing fields" });
        const item = await storage.upsertOpportunityTracker(
          req.user.id,
          opportunityId,
          status,
          notes,
        );
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to update tracker" });
      }
    },
  );

  app.delete(
    "/api/opportunity-tracker/:opportunityId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.deleteOpportunityTracker(
          req.user.id,
          req.params.opportunityId,
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete tracker item" });
      }
    },
  );

}
