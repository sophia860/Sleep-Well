import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { insertCompostSchema, insertGrowthJournalSchema, insertInnerWeatherSchema, insertReflectionSchema, insertIdeaDropSchema, users, writings, reflections } from "@shared/schema";

export function registerGardenRoutes(app: Express) {
  const replantResponseSchema = z.object({
    status: z.enum(["accepted", "declined"]),
  });

  app.get("/api/garden-feed", isAuthenticated, async (req: any, res) => {
    try {
      const { readiness, genre, editorial } = req.query;
      const filters: {
        readiness?: string;
        genre?: string;
        editorialOnly?: boolean;
      } = {};
      if (readiness && readiness !== "all")
        filters.readiness = readiness as string;
      if (genre && genre !== "all") filters.genre = genre as string;
      if (editorial === "true") filters.editorialOnly = true;
      const feed = await storage.getGardenFeed(filters);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching garden feed:", error);
      res.status(500).json({ message: "Failed to fetch garden feed" });
    }
  });

  app.get("/api/discovery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feed = await storage.getDiscoveryFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching discovery feed:", error);
      res.status(500).json({ message: "Failed to fetch discovery feed" });
    }
  });

  app.get(
    "/api/garden-profile/:userId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const writings = await storage.getProfileGarden(req.params.userId);
        res.json(writings);
      } catch (error) {
        console.error("Error fetching profile garden:", error);
        res.status(500).json({ message: "Failed to fetch profile garden" });
      }
    },
  );

  app.get("/api/compost", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getCompostEntries(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch compost" });
    }
  });

  app.post("/api/compost", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertCompostSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createCompostEntry(req.user.id, {
        content: parsed.data.content,
        sourceWritingId: parsed.data.sourceWritingId ?? undefined,
      });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create compost entry" });
    }
  });

  app.patch(
    "/api/compost/:id/recycle",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const entry = await storage.recycleCompostEntry(
          req.user.id,
          req.params.id,
        );
        if (!entry) return res.status(404).json({ message: "Not found" });
        res.json(entry);
      } catch (error) {
        res.status(500).json({ message: "Failed to recycle" });
      }
    },
  );

  app.delete("/api/compost/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCompostEntry(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/growth-journal", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getGrowthJournalEntries(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/growth-journal", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertGrowthJournalSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createGrowthJournalEntry(req.user.id, {
        entry: parsed.data.entry,
        linkedWritingId: parsed.data.linkedWritingId ?? undefined,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.delete(
    "/api/growth-journal/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteGrowthJournalEntry(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete" });
      }
    },
  );

  app.get("/api/inner-weather", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getInnerWeatherEntries(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weather entries" });
    }
  });

  app.post("/api/inner-weather", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertInnerWeatherSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createInnerWeatherEntry(req.user.id, {
        mood: parsed.data.mood,
        energy: parsed.data.energy ?? 5,
        note: parsed.data.note ?? undefined,
      });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create weather entry" });
    }
  });

  app.get("/api/reflections", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getReflections(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reflections" });
    }
  });

  app.post("/api/reflections", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertReflectionSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createReflection(req.user.id, {
        topic: parsed.data.topic,
        body: parsed.data.body,
        linkedWritingId: parsed.data.linkedWritingId ?? undefined,
      });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reflection" });
    }
  });

  app.delete("/api/reflections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteReflection(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/seasonal-review", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getSeasonalStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seasonal review" });
    }
  });

  app.get("/api/replant-requests", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getReplantRequests(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch replant requests" });
    }
  });

  app.patch(
    "/api/replant-requests/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = replantResponseSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const request = await storage.respondToReplantRequest(
          req.user.id,
          req.params.id,
          parsed.data.status,
        );
        if (!request) return res.status(404).json({ message: "Not found" });
        res.json(request);
      } catch (error) {
        res.status(500).json({ message: "Failed to respond" });
      }
    },
  );

  app.post(
    "/api/tending/:gardenerId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const tenderId = req.user.id;
        const { gardenerId } = req.params;
        if (tenderId === gardenerId)
          return res
            .status(400)
            .json({ message: "Cannot tend your own garden" });
        const result = await storage.tendGarden(tenderId, gardenerId);
        await storage.createNotification(gardenerId, {
          type: "new_tender",
          actorId: tenderId,
          message: "started tending your garden",
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to tend garden" });
      }
    },
  );

  app.delete(
    "/api/tending/:gardenerId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.untendGarden(
          req.user.id,
          req.params.gardenerId,
        );
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Untended garden" });
      } catch (error) {
        res.status(500).json({ message: "Failed to untend" });
      }
    },
  );

  app.get("/api/tending", isAuthenticated, async (req: any, res) => {
    try {
      const gardens = await storage.getTending(req.user.id);
      res.json(gardens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tending" });
    }
  });

  app.get("/api/tenders", isAuthenticated, async (req: any, res) => {
    try {
      const tenders = await storage.getTenders(req.user.id);
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenders" });
    }
  });

  app.get(
    "/api/tending/check/:gardenerId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const isTending = await storage.isTending(
          req.user.id,
          req.params.gardenerId,
        );
        res.json({ isTending });
      } catch (error) {
        res.status(500).json({ message: "Failed to check tending" });
      }
    },
  );

  app.get("/api/tending-feed", isAuthenticated, async (req: any, res) => {
    try {
      const feed = await storage.getTendingFeed(req.user.id);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tending feed" });
    }
  });

  app.get(
    "/api/tending-count/:userId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const count = await storage.getTendingCount(req.params.userId);
        res.json({ count });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch count" });
      }
    },
  );

  app.get(
    "/api/quiet-read/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const hasRead = await storage.hasQuietRead(
          userId,
          req.params.writingId,
        );
        res.json({ hasRead });
      } catch (error) {
        res.status(500).json({ message: "Failed to check quiet read" });
      }
    },
  );

  app.post(
    "/api/quiet-read/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await storage.addQuietRead(userId, req.params.writingId);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to add quiet read" });
      }
    },
  );

  app.post("/api/quiet-read-counts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingIds } = req.body;
      if (!Array.isArray(writingIds) || writingIds.length === 0)
        return res.json({});
      const limitedIds = writingIds
        .filter((id: any) => typeof id === "string")
        .slice(0, 100);
      const userWritings = await storage.getWritingsByAuthor(userId);
      const ownedIds = new Set(userWritings.map((w) => w.id));
      const authorizedIds = limitedIds.filter((id: string) => ownedIds.has(id));
      if (authorizedIds.length === 0) return res.json({});
      const counts = await storage.getQuietReadCounts(authorizedIds);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch read counts" });
    }
  });

  app.get(
    "/api/quietly-read/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const hasBeenRead = await storage.hasBeenQuietlyRead(
          req.params.writingId,
        );
        res.json({ hasBeenRead });
      } catch (error) {
        res.status(500).json({ message: "Failed to check quiet read status" });
      }
    },
  );

  app.get("/api/idea-drops", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getIdeaDrops();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get idea drops" });
    }
  });

  app.post("/api/idea-drops", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertIdeaDropSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const item = await storage.createIdeaDrop(
        req.user.id,
        parsed.data,
      );
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create idea drop" });
    }
  });

  app.post(
    "/api/idea-drops/:id/adopt",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.adoptIdeaDrop(
          req.user.id,
          req.params.id,
        );
        if (!item)
          return res
            .status(404)
            .json({ message: "Not found or already adopted" });
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to adopt idea drop" });
      }
    },
  );

  app.delete("/api/idea-drops/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteIdeaDrop(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete idea drop" });
    }
  });

  app.post("/api/presence", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.updatePresence(userId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error updating presence:", error);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  app.get("/api/garden-pulse", async (req: any, res) => {
    try {
      const activeCount = await storage.getActiveWriterCount();
      const summary = await storage.getGardenSummary();
      res.json({ ...summary, activeWriters: activeCount });
    } catch (error) {
      console.error("Error fetching garden pulse:", error);
      res.status(500).json({ message: "Failed to fetch garden pulse" });
    }
  });

  app.get("/api/public-garden/:userId", async (req, res) => {
    try {
      const profile = await storage.getPublicGarden(req.params.userId);
      if (!profile)
        return res.status(404).json({ message: "Writer not found" });
      res.json(profile);
    } catch (error) {
      console.error("Error fetching public garden:", error);
      res.status(500).json({ message: "Failed to fetch public garden" });
    }
  });

  app.get("/api/struggle-signals", isAuthenticated, async (req, res) => {
    try {
      const signals = await storage.getStruggleSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  app.post(
    "/api/writings/:id/compost",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const entries = await storage.compostWriting(req.params.id, userId);
        res.json({ fragments: entries.length, entries });
      } catch (error: any) {
        console.error("Error composting writing:", error);
        res
          .status(400)
          .json({ message: error.message || "Failed to compost writing" });
      }
    },
  );

  app.get("/api/compost/pile", async (req, res) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const pile = await storage.getCompostPile(limit);
      res.json(pile);
    } catch (error) {
      console.error("Error fetching compost pile:", error);
      res.status(500).json({ message: "Failed to fetch compost pile" });
    }
  });

  app.get("/api/compost/stats", async (req, res) => {
    try {
      const stats = await storage.getCompostStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching compost stats:", error);
      res.status(500).json({ message: "Failed to fetch compost stats" });
    }
  });

  app.post(
    "/api/compost/:id/recycle",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const entry = await storage.recycleCompostEntry(userId, req.params.id);
        if (!entry) return res.status(404).json({ message: "Not found" });
        res.json(entry);
      } catch (error) {
        console.error("Error recycling compost entry:", error);
        res.status(500).json({ message: "Failed to recycle compost entry" });
      }
    },
  );

  app.post("/api/garden/presence", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const zone = req.body.zone || "desk";
      await storage.updatePresenceWithZone(userId, zone);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error updating garden presence:", error);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  app.get("/api/garden/presence", async (req, res) => {
    try {
      const total = await storage.getActivePresence();
      const byZone = await storage.getActivePresenceByZone();
      res.json({ total, byZone });
    } catch (error) {
      console.error("Error fetching garden presence:", error);
      res.status(500).json({ message: "Failed to fetch presence" });
    }
  });

  app.get("/api/garden/season", async (req, res) => {
    try {
      const season = await storage.getCurrentSeason();
      res.json(season);
    } catch (error) {
      console.error("Error fetching current season:", error);
      res.status(500).json({ message: "Failed to fetch current season" });
    }
  });

  app.get(
    "/api/noticing-prompts/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const responses = await storage.getNoticingResponses(userId);
        res.json(responses);
      } catch (error) {
        console.error("Error fetching noticing responses:", error);
        res.status(500).json({ message: "Failed to fetch noticing responses" });
      }
    },
  );

  app.post(
    "/api/noticing-prompts/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { promptNumber, content, stage } = req.body;
        if (
          typeof promptNumber !== "number" ||
          promptNumber < 1 ||
          promptNumber > 100
        ) {
          return res.status(400).json({ message: "Invalid prompt number" });
        }
        if (!content || typeof content !== "string") {
          return res.status(400).json({ message: "Content is required" });
        }
        const stageValue = stage || "seed";
        const firstLine =
          content.split("\n")[0]?.trim().substring(0, 80) ||
          `Art of Noticing #${promptNumber}`;
        const title = firstLine || `Art of Noticing #${promptNumber}`;

        const existing = await storage.getNoticingResponses(userId);
        const existingResponse = existing.find(
          (r) => r.promptNumber === promptNumber,
        );

        let writingId = existingResponse?.writingId || undefined;
        if (writingId) {
          await storage.updateWriting(writingId, userId, {
            title,
            content: `<p>${content.replace(/\n/g, "</p><p>")}</p>`,
            stage: stageValue,
          });
        } else {
          const writing = await storage.createWriting(userId, {
            title,
            content: `<p>${content.replace(/\n/g, "</p><p>")}</p>`,
            stage: stageValue,
            genre: "observation",
            readiness: "raw_seed",
            visibility: "personal",
            tags: ["art-of-noticing", `prompt-${promptNumber}`],
          });
          writingId = writing.id;
        }

        const response = await storage.upsertNoticingResponse(
          userId,
          promptNumber,
          content,
          stageValue,
          writingId,
        );
        res.json(response);
      } catch (error) {
        console.error("Error saving noticing response:", error);
        res.status(500).json({ message: "Failed to save response" });
      }
    },
  );

  app.get("/api/garden/entries", async (_req, res) => {
    try {
      const { db } = await import("../db");
      const { writings, users } = await import("../shared/schema");
      const { eq, and, desc } = await import("drizzle-orm");
      const entries = await db
        .select({
          id: writings.id,
          title: writings.title,
          content: writings.content,
          stage: writings.stage,
          genre: writings.genre,
          tags: writings.tags,
          publishedAt: writings.publishedAt,
          createdAt: writings.createdAt,
          authorId: writings.authorId,
          authorName: users.displayName,
        })
        .from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(
          and(
            eq(writings.isPublicGarden, true),
            eq(writings.isArchived, false)
          )
        )
        .orderBy(desc(writings.createdAt))
        .limit(50);
      res.json(entries);
    } catch (error) {
      console.error("Garden entries error:", error);
      res.status(500).json({ message: "Failed to fetch garden entries" });
    }
  });

}
