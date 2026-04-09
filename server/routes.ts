import { registerAuthorEditorConversationRoutes } from "./routes/authorEditorConversations";
import { registerCopyAgentRoutes } from "./routes/copyAgent";
import { registerEditorialBriefRoutes } from "./routes/editorialBriefs";
import { registerSocialFeedRoutes } from "./routes/socialFeed";
import { registerPromptFloaterRoutes } from "./routes/promptFloater";
import { registerDesignAgentRoutes } from "./routes/designAgent";
import { registerGalleryFeedbackRoutes } from "./routes/galleryFeedback";
import { registerEditorialRoomRoutes } from "./routes/editorialRooms";
import { registerServiceInquiryRoutes } from "./routes/serviceInquiries";
import { registerEditorialOrderRoutes } from "./routes/editorialOrders";
import { registerWritingLayoutRoutes } from "./routes/writingLayout";
import { registerWritingExerciseRoutes } from "./routes/writingExercises";
import { registerJournalApplicationRoutes } from "./routes/journalApplications";
import { registerMarketplaceRoutes } from "./routes/marketplace";
import { registerPoemWeavingRoutes } from "./routes/poemWeaving";
import { registerAgentSystemRoutes } from "./routes/agentSystem";
import { registerAgentPatternRoutes } from "./routes/agentPatterns";
import { registerAgentActivityDashboardRoutes } from "./routes/agentActivityDashboard";
import { registerEicCommandCentreRoutes } from "./routes/eicCommandCentre";
import { registerTakeoverScreenRoutes } from "./routes/takeoverScreens";
import { registerGalleryDiscoverRoutes } from "./routes/galleryDiscover";
import { registerInstagramSquaresRoutes } from "./routes/instagramSquares";
import { registerOpenCallsRoutes } from "./routes/openCalls";
import { registerPoetMonetisationRoutes } from "./routes/poetMonetisation";
import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from "docx";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import {
  setupAuth,
  registerAuthRoutes,
  isAuthenticated,
} from "./replit_integrations/auth";
import {
  insertWritingSchema,
  updateWritingSchema,
  insertReadingQueueSchema,
  insertSavedPieceSchema,
  insertPollinationSchema,
  insertRitualSessionSchema,
  insertCompostSchema,
  insertGrowthJournalSchema,
  insertInnerWeatherSchema,
  insertReflectionSchema,
  insertCircleSchema,
  insertCircleMessageSchema,
  insertMoonlitReadingSchema,
  insertRootInfluenceSchema,
  insertResonanceSchema,
  insertMarginaliaSchema,
  insertTableTopicSchema,
  insertTableReplySchema,
  insertWorkshopExerciseSchema,
  insertWorkshopResponseSchema,
  insertSwapRequestSchema,
  insertSwapFeedbackSchema,
  insertMicroSwapSchema,
  insertGreenhouseEntrySchema,
  insertPublishRequestSchema,
  insertRequestMessageSchema,
  insertIssueSchema,
  insertIssuePieceSchema,
  insertEditorNoteSchema,
  insertCircleIntentionSchema,
  insertCircleCelebrationSchema,
  insertRejectionWallSchema,
  insertOpportunitySchema,
  insertOpportunityNoteSchema,
  insertPromptPotluckSchema,
  insertCircleShareSchema,
  insertIdeaDropSchema,
  insertCircleMicroResponseSchema,
  insertEditorialFlagSchema,
  insertSubmissionCallSchema,
  insertFirstReaderDropSchema,
  insertFirstReaderResponseSchema,
  insertReadingShelfSchema,
  courses,
  courseLessons,
  insertExhibitResponseSchema,
  insertExhibitReflectionSchema,
  galleryComments,
  chapbookCollections,
  collectionItems,
  collectionUnlocks,
  insertChapbookCollectionSchema,
  updateChapbookCollectionSchema,
  insertCollectionItemSchema,
  users,
  insertSiteContentSchema,
  siteContent,
  prompts as promptsTable,
  appreciations,
  letters,
  echoes,
  whispers,
  insertLetterSchema,
  insertContactMessageSchema,
  insertConversationSchema,
  insertChatMessageSchema,
    editorialWaitlist,
  insertEditorialWaitlistSchema,
    writings,
  ritualSessions,
  innerWeather,
  reflections,
    insertBoardPostSchema,
  boardPosts,
  growthJournalEntries,
  pollinations,
  savedPieces,
  resonances,
  
  
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, sql, desc, count } from "drizzle-orm";
import { dailyPrompts } from "@shared/schema";
import { circles, circleMembers, circleShares } from "@shared/schema";

const joinMoonlitReadingSchema = z.object({
  writingId: z.string().optional(),
});

const publishRequestResponseSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

async function isEditor(req: any, res: any, next: any) {
  // Populate req.user from session for non-Replit auth
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      (req as any).user = sessionUser;
    }
  }
  const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const editor = await storage.isEditor(userId);
  if (!editor) {
    return res.status(403).json({ message: "Editor access required" });
  }
  next();
}

async function isEditorInChief(req: any, res: any, next: any) {
  // Populate req.user from session for non-Replit auth
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      (req as any).user = sessionUser;
    }
  }
  const eicUserId = req.user?.claims?.sub || req.user?.id;
    if (!eicUserId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const eic = await storage.isEditorInChief(eicUserId);
  if (!eic) {
    return res.status(403).json({ message: "Editor-in-Chief access required" });
  }
  next();
}

const replantResponseSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === HEALTH CHECK ===
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

    // === KEEP-ALIVE SELF-PING (prevents Render free-tier spin-down) ===
  const KEEP_ALIVE_URL = "https://thepagegalleryjournal.com/health";
  const KEEP_ALIVE_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes
  setInterval(async () => {
    try {
      const res = await fetch(KEEP_ALIVE_URL);
      console.log(`[keep-alive] pinged ${KEEP_ALIVE_URL} — status ${res.status}`);
    } catch (err) {
      console.error("[keep-alive] ping failed:", err);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
  console.log(`[keep-alive] self-ping active every ${KEEP_ALIVE_INTERVAL_MS / 60000} min → ${KEEP_ALIVE_URL}`);

  // === SEO: ROBOTS.TXT ===
  app.get("/robots.txt", (_req, res) => {
    res
      .type("text/plain")
      .send(
        `User-agent: *\nAllow: /\nDisallow: /garden\nDisallow: /edit-profile\nDisallow: /editor-studio\nDisallow: /eic-dashboard\nDisallow: /api/\n\nSitemap: ${_req.protocol}://${_req.get("host")}/sitemap.xml`,
      );
  });

  // === SEO: SITEMAP.XML ===
  app.get("/sitemap.xml", (_req, res) => {
    const baseUrl = `${_req.protocol}://${_req.get("host")}`;
    const pages = [
      { path: "/", priority: "1.0", changefreq: "weekly" },
      { path: "/about", priority: "0.8", changefreq: "monthly" },
      { path: "/in-bloom", priority: "0.9", changefreq: "weekly" },
      { path: "/seasons", priority: "0.7", changefreq: "weekly" },
      { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
      { path: "/field-guide", priority: "0.6", changefreq: "monthly" },
      { path: "/greenhouse", priority: "0.6", changefreq: "monthly" },
      { path: "/commons", priority: "0.7", changefreq: "daily" },
      { path: "/opportunities", priority: "0.7", changefreq: "weekly" },
      { path: "/exhibits", priority: "0.7", changefreq: "weekly" },
      { path: "/courses", priority: "0.6", changefreq: "monthly" },
      { path: "/sign-in", priority: "0.5", changefreq: "yearly" },
      { path: "/privacy", priority: "0.3", changefreq: "yearly" },
      { path: "/terms", priority: "0.3", changefreq: "yearly" },
      { path: "/editor-onboarding", priority: "0.4", changefreq: "yearly" },
    ];
    const today = new Date().toISOString().split("T")[0];
    const urls = pages
      .map(
        (p) =>
          `  <url>\n    <loc>${baseUrl}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
      )
      .join("\n");
    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
      );
  });

    // GET /api/writings/drafts — FIX 4: server-side drafts filter by userId
  app.get("/api/writings/drafts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const allWritings = await storage.getWritingsByAuthor(userId);
      const drafts = allWritings.filter((w: any) => !w.isPublished);
      return res.json(drafts);
    } catch (err) {
      console.error("[GET /api/writings/drafts] failed:", err);
      return res.status(500).json({ error: "Failed to load drafts" });
    }
  });
  // === WRITINGS ===
  app.get("/api/writings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const writings = await storage.getWritingsByAuthor(userId);
      res.json(writings);
    } catch (error) {
      console.error("Error fetching writings:", error);
      res.status(500).json({ message: "Failed to fetch writings" });
    }
  });

  // GET /api/garden/last-draft — returns the user's most recently updated writing
app.get("/api/garden/last-draft", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const writings = await storage.getWritingsByAuthor(userId);
    if (!writings || writings.length === 0) {
      return res.json(null);
    }
    // Sort by updated_at descending, return the most recent
    const lastDraft = writings.sort((a: any, b: any) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
    res.json(lastDraft);
  } catch (error) {
    console.error("Error fetching last draft:", error);
    res.status(500).json({ message: "Failed to fetch last draft" });
  }
});

  app.post("/api/writings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertWritingSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            message: "Invalid writing data",
            errors: parsed.error.flatten(),
          });
      const writing = await storage.createWriting(userId, parsed.data);
      res.status(201).json(writing);
    } catch (error) {
      console.error("Error creating writing:", error);
      res.status(500).json({ message: "Failed to create writing" });
    }
  });

  app.patch("/api/writings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = updateWritingSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            message: "Invalid update data",
            errors: parsed.error.flatten(),
          });

      if (parsed.data.readiness) {
        const current = await storage.getWriting(req.params.id);
        if (
          current &&
          current.authorId === userId &&
          current.readiness !== parsed.data.readiness
        ) {
          const plainText = current.content.replace(/<[^>]*>/g, "");
          const wc = plainText.trim()
            ? plainText.trim().split(/\s+/).length
            : 0;
          await storage.createSnapshot({
            writingId: current.id,
            title: current.title,
            content: current.content,
            readiness: current.readiness,
            wordCount: wc,
          });
        }
      }

      const writing = await storage.updateWriting(
        req.params.id,
        userId,
        parsed.data,
      );
      if (!writing)
        return res.status(404).json({ message: "Writing not found" });
      res.json(writing);
    } catch (error) {
      console.error("Error updating writing:", error);
      res.status(500).json({ message: "Failed to update writing" });
    }
  });

  app.get(
    "/api/writings/:id/snapshots",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing || writing.authorId !== userId)
          return res.status(404).json({ message: "Writing not found" });
        const snapshots = await storage.getSnapshots(req.params.id);
        res.json(snapshots);
      } catch (error) {
        console.error("Error fetching snapshots:", error);
        res.status(500).json({ message: "Failed to fetch snapshots" });
      }
    },
  );

  app.delete("/api/writings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteWriting(req.params.id, userId);
      if (!deleted)
        return res.status(404).json({ message: "Writing not found" });
      res.json({ message: "Writing deleted" });
    } catch (error) {
      console.error("Error deleting writing:", error);
      res.status(500).json({ message: "Failed to delete writing" });
    }
  });

  app.delete(
    "/api/writings/bulk/empty",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const count = await storage.deleteEmptyWritings(userId);
        res.json({ deleted: count });
      } catch (error) {
        console.error("Error cleaning up empty drafts:", error);
        res.status(500).json({ message: "Failed to clean up drafts" });
      }
    },
  );

  // === GALLERY ===
  app.get("/api/gallery", async (req, res) => {
    try {
      const { q, genre } = req.query;
      if (q) {
        const results = await storage.searchPublishedWritings(
          q as string,
          genre as string | undefined,
        );
        return res.json(results);
      }
      const published = await storage.getPublishedWritings();
      if (genre && typeof genre === "string") {
        const filtered = published.filter(
          (p: any) => p.genre && p.genre.toLowerCase() === genre.toLowerCase(),
        );
        return res.json(filtered);
      }
      res.json(published);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // === DAILY LETTER ===
  app.get("/api/daily-letter", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const letter = await storage.getDailyLetter(userId);
      if (!letter) return res.json(null);
      res.json(letter);
    } catch (error) {
      console.error("Error fetching daily letter:", error);
      res.status(500).json({ message: "Failed to fetch daily letter" });
    }
  });

  // === GARDEN FEED (members-only) ===
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

  // === TAG-BASED DISCOVERY ===
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

  // === PROFILE GARDEN ===
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

  // === CIRCLE FEED ===
  app.get("/api/circle-feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feed = await storage.getCircleFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching circle feed:", error);
      res.status(500).json({ message: "Failed to fetch circle feed" });
    }
  });

  // === READING QUEUE ===
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

  // === READING NOTES (annotation → seed) ===
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

  // === SAVED PIECES ===
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

  // === POLLINATION ===
  app.get(
    "/api/pollinations/received",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getPollinationsReceived(
          req.user.id,
        );
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch pollinations" });
      }
    },
  );

  app.get("/api/pollinations/:writingId", async (req, res) => {
    try {
      const items = await storage.getPollinationsForWriting(
        req.params.writingId,
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pollinations" });
    }
  });

  app.post("/api/pollinations", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertPollinationSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createPollination(req.user.id, {
        writingId: parsed.data.writingId,
        affirmation: parsed.data.affirmation,
        highlightText: parsed.data.highlightText ?? undefined,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create pollination" });
    }
  });

  // === PROMPTS & RITUALS ===
  app.get("/api/prompts", async (req, res) => {
    try {
      const { category } = req.query;
      const items = await storage.getPrompts(category as string | undefined);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/random", async (req, res) => {
    try {
      const { category } = req.query;
      const prompt = await storage.getRandomPrompt(
        category as string | undefined,
      );
      if (!prompt) return res.status(404).json({ message: "No prompts found" });
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random prompt" });
    }
  });

  // === DAILY PROMPT ===
  app.get("/api/daily-prompt", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let [prompt] = await db
        .select()
        .from(dailyPrompts)
        .where(
          and(
            sql`${dailyPrompts.activeDate} >= ${today}`,
            sql`${dailyPrompts.activeDate} < ${tomorrow}`,
          ),
        )
        .limit(1);

      if (!prompt) {
        const promptTexts = [
          "Write about a door you've never opened.",
          "Describe a color without naming it.",
          "What would your younger self think of you now?",
          "Write from the perspective of an object in your room.",
          "Begin with: 'The last time I was truly lost...'",
          "Write about a sound that changed everything.",
          "Describe someone you've forgotten but shouldn't have.",
          "What lives at the bottom of the deepest ocean?",
          "Write a letter to someone you'll never send.",
          "Describe the space between two heartbeats.",
          "Write about the first thing you remember seeing.",
          "What would silence look like if it had a shape?",
          "Describe a meal that changed your life.",
          "Write about something you found that wasn't yours.",
          "Begin with: 'In the garden of my mind...'",
          "Write about a promise you made to yourself.",
          "Describe the moment just before dawn.",
          "What does your shadow do when you're not looking?",
          "Write about a word you wish existed.",
          "Describe the taste of a memory.",
          "Write about someone waiting.",
          "What grows in the cracks of sidewalks?",
          "Describe a conversation you overheard.",
          "Write about the space between two people.",
          "Begin with: 'I never told anyone about...'",
          "Write about what the rain remembers.",
          "Describe your hands from the perspective of something they've held.",
          "What would you find in a museum of lost things?",
          "Write about a bridge, real or imagined.",
          "Describe the feeling of almost remembering something.",
        ];
        const idx = Math.floor(today.getTime() / 86400000) % promptTexts.length;
        const categories = [
          "freewrite",
          "poetry",
          "fiction",
          "reflection",
          "observation",
        ];
        const catIdx =
          Math.floor(today.getTime() / 86400000) % categories.length;

        [prompt] = await db
          .insert(dailyPrompts)
          .values({
            text: promptTexts[idx],
            category: categories[catIdx],
            activeDate: today,
          })
          .returning();
      }

      res.json(prompt);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch daily prompt" });
    }
  });

  app.get("/api/daily-prompts/recent", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingPrompts = await db
        .select()
        .from(dailyPrompts)
        .where(
          and(
            sql`${dailyPrompts.activeDate} >= ${sevenDaysAgo}`,
            sql`${dailyPrompts.activeDate} < ${tomorrow}`,
          ),
        );

      const promptTexts = [
        "Write about a door you've never opened.",
        "Describe a color without naming it.",
        "What would your younger self think of you now?",
        "Write from the perspective of an object in your room.",
        "Begin with: 'The last time I was truly lost...'",
        "Write about a sound that changed everything.",
        "Describe someone you've forgotten but shouldn't have.",
        "What lives at the bottom of the deepest ocean?",
        "Write a letter to someone you'll never send.",
        "Describe the space between two heartbeats.",
        "Write about the first thing you remember seeing.",
        "What would silence look like if it had a shape?",
        "Describe a meal that changed your life.",
        "Write about something you found that wasn't yours.",
        "Begin with: 'In the garden of my mind...'",
        "Write about a promise you made to yourself.",
        "Describe the moment just before dawn.",
        "What does your shadow do when you're not looking?",
        "Write about a word you wish existed.",
        "Describe the taste of a memory.",
        "Write about someone waiting.",
        "What grows in the cracks of sidewalks?",
        "Describe a conversation you overheard.",
        "Write about the space between two people.",
        "Begin with: 'I never told anyone about...'",
        "Write about what the rain remembers.",
        "Describe your hands from the perspective of something they've held.",
        "What would you find in a museum of lost things?",
        "Write about a bridge, real or imagined.",
        "Describe the feeling of almost remembering something.",
      ];
      const categories = [
        "freewrite",
        "poetry",
        "fiction",
        "reflection",
        "observation",
      ];

      const existingByDate = new Map<string, (typeof existingPrompts)[0]>();
      for (const p of existingPrompts) {
        const d = new Date(p.activeDate);
        d.setHours(0, 0, 0, 0);
        existingByDate.set(d.toISOString(), p);
      }

      const results: typeof existingPrompts = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const key = date.toISOString();

        const existing = existingByDate.get(key);
        if (existing) {
          results.push(existing);
        } else {
          const idx =
            Math.floor(date.getTime() / 86400000) % promptTexts.length;
          const catIdx =
            Math.floor(date.getTime() / 86400000) % categories.length;

          const [newPrompt] = await db
            .insert(dailyPrompts)
            .values({
              text: promptTexts[idx],
              category: categories[catIdx],
              activeDate: date,
            })
            .returning();
          results.push(newPrompt);
        }
      }

      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch recent daily prompts" });
    }
  });

  app.get("/api/rituals", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getRitualSessions(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ritual sessions" });
    }
  });

  app.post("/api/rituals", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertRitualSessionSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const session = await storage.createRitualSession(req.user.id, {
        output: parsed.data.output || "",
        durationMinutes: parsed.data.durationMinutes || 10,
        promptId: parsed.data.promptId ?? undefined,
      });
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ritual session" });
    }
  });

  // === COMPOST ===
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

  // === GROWTH JOURNAL ===
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

  app.get("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const subs = await storage.getSubmissions(req.user.id);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getSubmissionStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submission stats" });
    }
  });

  app.get(
    "/api/submissions/by-writing/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const subs = await storage.getSubmissionsByWriting(
          req.user.id,
          req.params.writingId,
        );
        res.json(subs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch submissions" });
      }
    },
  );

  app.post("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const sub = await storage.createSubmission(req.user.id, req.body);
      res.json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.patch("/api/submissions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const sub = await storage.updateSubmission(
        req.params.id,
        req.user.id,
        req.body,
      );
      if (!sub)
        return res.status(404).json({ message: "Submission not found" });
      res.json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  app.delete("/api/submissions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteSubmission(
        req.params.id,
        req.user.id,
      );
      if (!deleted)
        return res.status(404).json({ message: "Submission not found" });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  app.post(
    "/api/submissions/:id/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const sub = await storage.updateSubmission(
          req.params.id,
          req.user.id,
          {
            status: "accepted",
            respondedAt: new Date(),
          },
        );
        if (!sub)
          return res.status(404).json({ message: "Submission not found" });
        const otherSubs = sub.writingId
          ? await storage.getSubmissionsByWriting(
              req.user.id,
              sub.writingId,
            )
          : [];
        const pendingElsewhere = otherSubs.filter(
          (s) => s.id !== sub.id && s.status === "pending",
        );
        res.json({ submission: sub, pendingElsewhere });
      } catch (error) {
        res.status(500).json({ message: "Failed to accept submission" });
      }
    },
  );

  app.post(
    "/api/submissions/bulk-withdraw",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { submissionIds } = req.body;
        if (!Array.isArray(submissionIds))
          return res
            .status(400)
            .json({ message: "submissionIds array required" });
        const results = await Promise.all(
          submissionIds.map((id: string) =>
            storage.updateSubmission(id, req.user.id, {
              status: "withdrawn",
              respondedAt: new Date(),
            }),
          ),
        );
        res.json({ updated: results.filter(Boolean).length });
      } catch (error) {
        res.status(500).json({ message: "Failed to bulk withdraw" });
      }
    },
  );

  // === INNER WEATHER ===
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

  // === REFLECTIONS ===
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

  // === SEASONAL REVIEW ===
  app.get("/api/seasonal-review", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getSeasonalStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seasonal review" });
    }
  });

  // === ROOT SYSTEM ===
  app.get("/api/root-influences", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getRootInfluences(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch influences" });
    }
  });

  app.post("/api/root-influences", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertRootInfluenceSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const influence = await storage.createRootInfluence(req.user.id, {
        name: parsed.data.name,
        category: parsed.data.category ?? undefined,
        note: parsed.data.note ?? undefined,
      });
      res.status(201).json(influence);
    } catch (error) {
      res.status(500).json({ message: "Failed to create influence" });
    }
  });

  app.delete(
    "/api/root-influences/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteRootInfluence(
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

  // === CIRCLES ===
  app.get("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getCircles(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch circles" });
    }
  });

  app.post("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertCircleSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const circle = await storage.createCircle(
        req.user.id,
        parsed.data,
      );
      res.status(201).json(circle);
    } catch (error) {
      res.status(500).json({ message: "Failed to create circle" });
    }
  });

  app.post("/api/circles/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const circle = await storage.getCircle(req.params.id);
      if (!circle) return res.status(404).json({ message: "Circle not found" });
      const memberCount = await storage.getCircleMemberCount(req.params.id);
      if (memberCount >= circle.maxMembers) {
        return res.status(400).json({ message: "This circle is full" });
      }
      const member = await storage.joinCircle(
        req.user.id,
        req.params.id,
      );
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to join circle" });
    }
  });

  app.delete(
    "/api/circles/:id/leave",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const left = await storage.leaveCircle(
          req.user.id,
          req.params.id,
        );
        if (!left) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Left circle" });
      } catch (error) {
        res.status(500).json({ message: "Failed to leave circle" });
      }
    },
  );

  app.get(
    "/api/circles/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const messages = await storage.getCircleMessages(req.params.id);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/circles/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleMessageSchema.safeParse({
          ...req.body,
          circleId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const msg = await storage.createCircleMessage(req.user.id, {
          circleId: parsed.data.circleId,
          content: parsed.data.content,
          writingId: parsed.data.writingId ?? undefined,
        });
        res.status(201).json(msg);
      } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  // === CIRCLE SHARES ===
  app.get("/api/circles/:id/shares", isAuthenticated, async (req: any, res) => {
    try {
      const shares = await storage.getCircleShares(req.params.id);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  app.post(
    "/api/circles/:id/shares",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleShareSchema.safeParse({
          ...req.body,
          circleId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const share = await storage.createCircleShare(req.user.id, {
          circleId: parsed.data.circleId,
          writingId: parsed.data.writingId ?? undefined,
          weekOf: parsed.data.weekOf,
        });
        res.status(201).json(share);
      } catch (error) {
        res.status(500).json({ message: "Failed to create share" });
      }
    },
  );

  app.get(
    "/api/circles/:id/current-sharer",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const sharer = await storage.getCurrentSharer(req.params.id);
        res.json(sharer);
      } catch (error) {
        res.status(500).json({ message: "Failed to get current sharer" });
      }
    },
  );

  app.get(
    "/api/circles/:id/members",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        res.json(members);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch members" });
      }
    },
  );

  // === CIRCLE MICRO-PROMPTS ===
  app.get(
    "/api/circles/:id/micro-prompt",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        const isMember = members.some(
          (m: any) => m.userId === req.user.id,
        );
        if (!isMember)
          return res
            .status(403)
            .json({ message: "Not a member of this circle" });
        const prompt = await storage.getCircleWeeklyPrompt(req.params.id);
        res.json(prompt);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch micro-prompt" });
      }
    },
  );

  app.post(
    "/api/circles/:id/micro-prompt/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        const isMember = members.some(
          (m: any) => m.userId === req.user.id,
        );
        if (!isMember)
          return res
            .status(403)
            .json({ message: "Not a member of this circle" });
        const parsed = insertCircleMicroResponseSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.respondToCircleMicroPrompt(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to submit response" });
      }
    },
  );

  // === MOONLIT READINGS ===
  app.get("/api/moonlit-readings", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getMoonlitReadings();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch readings" });
    }
  });

  app.post("/api/moonlit-readings", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertMoonlitReadingSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const reading = await storage.createMoonlitReading(req.user.id, {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : undefined,
      });
      res.status(201).json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reading" });
    }
  });

  app.post(
    "/api/moonlit-readings/:id/join",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = joinMoonlitReadingSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const participant = await storage.joinMoonlitReading(
          req.user.id,
          req.params.id,
          parsed.data.writingId,
        );
        res.status(201).json(participant);
      } catch (error) {
        res.status(500).json({ message: "Failed to join reading" });
      }
    },
  );

  app.delete(
    "/api/moonlit-readings/:id/leave",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const left = await storage.leaveMoonlitReading(
          req.user.id,
          req.params.id,
        );
        if (!left) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Left reading" });
      } catch (error) {
        res.status(500).json({ message: "Failed to leave reading" });
      }
    },
  );

  // === REPLANT REQUESTS ===
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

  // === TENDING (FOLLOWS) ===
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

  // === RESONANCES (REACTIONS) ===
  app.post("/api/resonances", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId, type } = req.body;
      if (!writingId || !type)
        return res
          .status(400)
          .json({ message: "writingId and type are required" });
      const validTypes = [
        "glow",
        "pressed_flower",
        "dewdrop",
        "firefly",
        "roots",
        "tended",
        "spark",
        "fog",
        "seedling",
      ];
      if (!validTypes.includes(type))
        return res.status(400).json({ message: "Invalid resonance type" });
      const writing = await storage.getWriting(writingId);
      if (!writing)
        return res.status(404).json({ message: "Writing not found" });
      if (writing.authorId === req.user.id)
        return res
          .status(400)
          .json({ message: "Cannot resonate with your own work" });
      const result = await storage.addResonance(
        req.user.id,
        writingId,
        type,
      );
      const authorId = writing.authorId;
      await storage.createNotification(authorId, {
        type: "resonance",
        actorId: req.user.id,
        writingId,
        message: `left a ${type.replace("_", " ")} on "${writing.title || "Untitled"}"`,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to add resonance" });
    }
  });

  app.delete("/api/resonances", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId, type } = req.body;
      if (!writingId || !type)
        return res
          .status(400)
          .json({ message: "writingId and type are required" });
      const result = await storage.removeResonance(
        req.user.id,
        writingId,
        type,
      );
      res.json({ removed: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove resonance" });
    }
  });

  app.get(
    "/api/resonances/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const resonances = await storage.getResonancesForWriting(
          req.params.writingId,
        );
        const userResonances = await storage.getUserResonances(
          req.user.id,
          req.params.writingId,
        );
        res.json({ resonances, userResonances });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch resonances" });
      }
    },
  );

  // === MARGINALIA (COMMENTS) ===
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

  // === NOTIFICATIONS ===
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const items = await storage.getNotifications(
        req.user.id,
        unreadOnly,
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get(
    "/api/notifications/unread-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const count = await storage.getUnreadNotificationCount(
          req.user.id,
        );
        res.json({ count });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch count" });
      }
    },
  );

  app.patch(
    "/api/notifications/:id/read",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.markNotificationRead(
          req.user.id,
          req.params.id,
        );
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark read" });
      }
    },
  );

  app.patch(
    "/api/notifications/read-all",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.markAllNotificationsRead(req.user.id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark all read" });
      }
    },
  );

  // === TABLES (DISCUSSION THREADS) ===
  app.get("/api/tables", async (req, res) => {
    try {
      const { category } = req.query;
      const topics = await storage.getTableTopics(
        category as string | undefined,
      );
      res.json(topics);
    } catch (error) {
      console.error("Error fetching table topics:", error);
      res.status(500).json({ message: "Failed to fetch table topics" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const topic = await storage.getTableTopic(req.params.id);
      if (!topic) return res.status(404).json({ message: "Topic not found" });
      res.json(topic);
    } catch (error) {
      console.error("Error fetching table topic:", error);
      res.status(500).json({ message: "Failed to fetch table topic" });
    }
  });

  app.post("/api/tables", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertTableTopicSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const topic = await storage.createTableTopic(userId, parsed.data);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating table topic:", error);
      res.status(500).json({ message: "Failed to create table topic" });
    }
  });

  app.get("/api/tables/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getTableReplies(req.params.id);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching table replies:", error);
      res.status(500).json({ message: "Failed to fetch table replies" });
    }
  });

  app.post(
    "/api/tables/:id/replies",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertTableReplySchema.safeParse({
          ...req.body,
          topicId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const reply = await storage.createTableReply(userId, {
          topicId: req.params.id,
          content: parsed.data.content,
          parentId: parsed.data.parentId ?? undefined,
        });
        res.status(201).json(reply);
      } catch (error) {
        console.error("Error creating table reply:", error);
        res.status(500).json({ message: "Failed to create table reply" });
      }
    },
  );

  // === CAFÉ ===
  app.get("/api/cafe/today", async (req, res) => {
    try {
      const question = await storage.getTodayCafeQuestion();
      res.json(question);
    } catch (error) {
      console.error("Error fetching today's café question:", error);
      res.status(500).json({ message: "Failed to fetch today's question" });
    }
  });

  app.get("/api/cafe/questions/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getCafeResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching café responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.post(
    "/api/cafe/questions/:id/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const content = req.body.content?.trim();
        if (!content)
          return res.status(400).json({ message: "Content is required" });
        const response = await storage.createCafeResponse(userId, {
          questionId: req.params.id,
          content,
        });
        res.status(201).json(response);
      } catch (error) {
        console.error("Error creating café response:", error);
        res.status(500).json({ message: "Failed to create response" });
      }
    },
  );

  app.get("/api/cafe/past", async (req, res) => {
    try {
      const questions = await storage.getPastCafeQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching past café questions:", error);
      res.status(500).json({ message: "Failed to fetch past questions" });
    }
  });

  // === WORKSHOP (EXERCISES & RESPONSES) ===
  app.get("/api/workshop/prompt-of-day", async (req, res) => {
    try {
      const prompt = await storage.getPromptOfDay();
      if (!prompt)
        return res.status(404).json({ message: "No exercises available" });
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching prompt of the day:", error);
      res.status(500).json({ message: "Failed to fetch prompt of the day" });
    }
  });

  app.get("/api/workshop/exercises/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getWorkshopResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching exercise responses:", error);
      res.status(500).json({ message: "Failed to fetch exercise responses" });
    }
  });

  app.get("/api/workshop", async (req, res) => {
    try {
      const { category } = req.query;
      const exercises = await storage.getWorkshopExercises(
        category as string | undefined,
      );
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching workshop exercises:", error);
      res.status(500).json({ message: "Failed to fetch workshop exercises" });
    }
  });

  app.post("/api/workshop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertWorkshopExerciseSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const exercise = await storage.createWorkshopExercise(userId, {
        title: parsed.data.title,
        prompt: parsed.data.prompt,
        category: parsed.data.category,
        durationMinutes: parsed.data.durationMinutes ?? undefined,
      });
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating workshop exercise:", error);
      res.status(500).json({ message: "Failed to create workshop exercise" });
    }
  });

  app.get("/api/workshop/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getWorkshopResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching workshop responses:", error);
      res.status(500).json({ message: "Failed to fetch workshop responses" });
    }
  });

  app.post(
    "/api/workshop/:id/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertWorkshopResponseSchema.safeParse({
          ...req.body,
          exerciseId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.createWorkshopResponse(userId, {
          exerciseId: req.params.id,
          content: parsed.data.content,
        });
        res.status(201).json(response);
      } catch (error) {
        console.error("Error creating workshop response:", error);
        res.status(500).json({ message: "Failed to create workshop response" });
      }
    },
  );

  // === SWAP (BETA READING EXCHANGE) ===
  app.get("/api/swaps", async (req, res) => {
    try {
      const { status } = req.query;
      const swaps = await storage.getSwapRequests(status as string | undefined);
      res.json(swaps);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post("/api/swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertSwapRequestSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const swap = await storage.createSwapRequest(userId, {
        writingId: parsed.data.writingId,
        genre: parsed.data.genre,
        note: parsed.data.note ?? undefined,
        preferredLength: parsed.data.preferredLength ?? undefined,
        feedbackStyle: parsed.data.feedbackStyle ?? undefined,
      });
      res.status(201).json(swap);
    } catch (error) {
      console.error("Error creating swap request:", error);
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.post("/api/swaps/:id/match", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "writingId is required" });
      const swap = await storage.matchSwap(req.params.id, userId, writingId);
      if (!swap)
        return res.status(404).json({ message: "Swap request not found" });
      res.json(swap);
    } catch (error) {
      console.error("Error matching swap:", error);
      res.status(500).json({ message: "Failed to match swap" });
    }
  });

  app.get("/api/swaps/:id/feedback", async (req, res) => {
    try {
      const feedback = await storage.getSwapFeedback(req.params.id);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching swap feedback:", error);
      res.status(500).json({ message: "Failed to fetch swap feedback" });
    }
  });

  app.post(
    "/api/swaps/:id/feedback",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertSwapFeedbackSchema.safeParse({
          ...req.body,
          swapId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const feedback = await storage.createSwapFeedback(userId, {
          swapId: parsed.data.swapId,
          toUserId: parsed.data.toUserId,
          strengths: parsed.data.strengths,
          suggestions: parsed.data.suggestions,
          favoriteLines: parsed.data.favoriteLines ?? undefined,
        });
        res.status(201).json(feedback);
      } catch (error) {
        console.error("Error creating swap feedback:", error);
        res.status(500).json({ message: "Failed to create swap feedback" });
      }
    },
  );

  // === MICRO-SWAP ===
  app.post("/api/micro-swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertMicroSwapSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const swap = await storage.createMicroSwap(userId, {
        fragment: parsed.data.fragment,
        genre: parsed.data.genre ?? undefined,
      });
      res.status(201).json(swap);
    } catch (error) {
      console.error("Error creating micro-swap:", error);
      res.status(500).json({ message: "Failed to create micro-swap" });
    }
  });

  app.get("/api/micro-swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const swaps = await storage.getMyMicroSwaps(userId);
      res.json(swaps);
    } catch (error) {
      console.error("Error fetching micro-swaps:", error);
      res.status(500).json({ message: "Failed to fetch micro-swaps" });
    }
  });

  app.post(
    "/api/micro-swaps/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { response } = req.body;
        if (!response || typeof response !== "string")
          return res.status(400).json({ message: "Response is required" });
        const swap = await storage.respondToMicroSwap(
          req.params.id,
          userId,
          response,
        );
        if (!swap)
          return res.status(404).json({ message: "Micro-swap not found" });
        res.json(swap);
      } catch (error) {
        console.error("Error responding to micro-swap:", error);
        res.status(500).json({ message: "Failed to respond to micro-swap" });
      }
    },
  );

  // === WRITER PROFILE ===
  app.get("/api/writer/:id", async (req, res) => {
    try {
      const profile = await storage.getWriterProfile(req.params.id);
      if (!profile)
        return res.status(404).json({ message: "Writer not found" });
      res.json(profile);
    } catch (error) {
      console.error("Error fetching writer profile:", error);
      res.status(500).json({ message: "Failed to fetch writer profile" });
    }
  });

  app.patch("/api/profile/bio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bio } = req.body;
      if (typeof bio !== "string")
        return res.status(400).json({ message: "bio must be a string" });
      const result = await storage.updateBio(userId, bio);
      res.json(result);
    } catch (error) {
      console.error("Error updating bio:", error);
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

  app.patch("/api/user/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName, bio } = req.body;
      if (
        !displayName ||
        typeof displayName !== "string" ||
        displayName.trim().length === 0
      ) {
        return res.status(400).json({ message: "Username is required" });
      }
      if (displayName.trim().length > 100) {
        return res
          .status(400)
          .json({ message: "Username must be 100 characters or fewer" });
      }
      if (
        bio !== undefined &&
        typeof bio === "string" &&
        bio.trim().length > 500
      ) {
        return res
          .status(400)
          .json({ message: "Bio must be 500 characters or fewer" });
      }
      const updated = await storage.completeOnboarding(userId, {
        displayName: displayName.trim(),
        bio: typeof bio === "string" ? bio.trim() : undefined,
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName, bio, isAnonymous } = req.body;
      if (
        displayName !== undefined &&
        (typeof displayName !== "string" || displayName.trim().length > 100)
      ) {
        return res
          .status(400)
          .json({
            message: "Display name must be a string of 100 characters or fewer",
          });
      }
      if (
        bio !== undefined &&
        (typeof bio !== "string" || bio.trim().length > 500)
      ) {
        return res
          .status(400)
          .json({ message: "Bio must be a string of 500 characters or fewer" });
      }
      if (isAnonymous === false) {
        const existingUser = await storage.getUser(userId);
        if (existingUser && existingUser.isAnonymous) {
          return res
            .status(400)
            .json({
              message: "Anonymous mode cannot be turned off once enabled",
            });
        }
      }
      const updated = await storage.updateProfile(userId, {
        displayName:
          typeof displayName === "string" ? displayName.trim() : undefined,
        bio: typeof bio === "string" ? bio.trim() : undefined,
        isAnonymous: isAnonymous === true ? true : undefined,
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // === EDITORIAL / PUBLISHING ===
  app.get("/api/editorial/pieces", isAuthenticated, async (req: any, res) => {
    try {
      const pieces = await storage.getEditorialPieces();
      res.json(pieces);
    } catch (error) {
      console.error("Error fetching editorial pieces:", error);
      res.status(500).json({ message: "Failed to fetch editorial pieces" });
    }
  });

  app.post(
    "/api/editorial/publish/:writingId",
    isEditor,
    async (req: any, res) => {
      try {
        const result = await storage.publishWritingByEditor(
          req.params.writingId,
        );
        if (!result)
          return res.status(404).json({ message: "Writing not found" });
        res.json(result);
      } catch (error) {
        console.error("Error publishing writing:", error);
        res.status(500).json({ message: "Failed to publish writing" });
      }
    },
  );

  app.post(
    "/api/editor/publish-external",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { title, content, genre, authorName, authorId } = req.body;
        if (!title || !content || !genre || !authorName) {
          return res
            .status(400)
            .json({
              message: "Title, content, genre, and author name are required",
            });
        }
        const piece = await storage.publishExternalPiece({
          title,
          content,
          genre,
          authorName,
          authorId,
        });
        res.json(piece);
      } catch (error) {
        console.error("Error publishing external piece:", error);
        res.status(500).json({ message: "Failed to publish external piece" });
      }
    },
  );

  // === SUBMISSION CALLS ===

  app.get(
    "/api/editor/submission-calls",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const calls = await storage.getSubmissionCalls();
        res.json(calls);
      } catch (error) {
        console.error("Failed to fetch submission calls:", error);
        res.status(500).json({ message: "Failed to fetch submission calls" });
      }
    },
  );

  app.post(
    "/api/editor/submission-calls",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const {
          title,
          description,
          theme,
          prompt,
          issueId,
          startsAt,
          endsAt,
          flagLimit,
          status,
        } = req.body;
        if (!title || !startsAt || !endsAt) {
          return res
            .status(400)
            .json({ message: "Title, startsAt, and endsAt are required" });
        }
        const call = await storage.createSubmissionCall(req.user.id, {
          title,
          description: description || null,
          theme: theme || null,
          prompt: prompt || null,
          issueId: issueId || null,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          flagLimit: flagLimit || 3,
          status: status || "open",
        });
        res.json(call);
      } catch (error) {
        console.error("Failed to create submission call:", error);
        res.status(500).json({ message: "Failed to create submission call" });
      }
    },
  );

  app.patch(
    "/api/editor/submission-calls/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const updated = await storage.updateSubmissionCall(
          req.params.id,
          req.body,
        );
        if (!updated)
          return res.status(404).json({ message: "Submission call not found" });
        res.json(updated);
      } catch (error) {
        console.error("Failed to update submission call:", error);
        res.status(500).json({ message: "Failed to update submission call" });
      }
    },
  );

  app.delete(
    "/api/editor/submission-calls/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteSubmissionCall(req.params.id);
        if (!deleted)
          return res.status(404).json({ message: "Submission call not found" });
        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete submission call:", error);
        res.status(500).json({ message: "Failed to delete submission call" });
      }
    },
  );

  app.get(
    "/api/editor/submission-calls/:id/responses",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const responses = await storage.getSubmissionCallResponses(
          req.params.id,
        );
        res.json(responses);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch responses" });
      }
    },
  );

  app.patch(
    "/api/editor/submission-call-responses/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { status } = req.body;
        if (!status)
          return res.status(400).json({ message: "Status is required" });
        const updated = await storage.updateSubmissionCallResponseStatus(
          req.params.id,
          status,
        );
        if (!updated)
          return res.status(404).json({ message: "Response not found" });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Failed to update response status" });
      }
    },
  );

  app.get(
    "/api/submission-calls/open",
    async (req: any, res) => {
      try {
        const calls = await storage.getOpenSubmissionCalls();
        res.json(calls);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch open submission calls" });
      }
    },
  );

  app.post(
    "/api/submission-calls/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { writingId, note } = req.body;
        const call = await storage.getSubmissionCall(req.params.id);
        if (!call || call.status !== "open") {
          return res
            .status(400)
            .json({ message: "This submission call is not open" });
        }
        if (writingId) {
          const writing = await storage.getWriting(writingId);
          if (!writing || writing.authorId !== req.user.id) {
            return res
              .status(403)
              .json({ message: "You can only submit your own writings" });
          }
        }
        const response = await storage.createSubmissionCallResponse(
          req.user.id,
          {
            callId: req.params.id,
            writingId: writingId || null,
            note: note || null,
          },
        );
        res.json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to submit response" });
      }
    },
  );

  // === GALLERY OPT-IN ===

  app.patch(
    "/api/writings/:id/gallery-opt-in",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== req.user.id)
          return res.status(403).json({ message: "Not authorized" });
        const { galleryOptIn } = req.body;
        const updated = await storage.updateWriting(
          req.params.id,
          req.user.id,
          {
            galleryOptIn: !!galleryOptIn,
            galleryOptInAt: galleryOptIn ? new Date() : null,
          } as any,
        );
        res.json(updated);
      } catch (error) {
        console.error("Failed to update gallery opt-in:", error);
        res.status(500).json({ message: "Failed to update gallery opt-in" });
      }
    },
  );

  app.get(
    "/api/editor/gallery-opt-ins",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const writings = await storage.getGalleryOptInWritings();
        res.json(writings);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch gallery opt-ins" });
      }
    },
  );

  // === EDITOR STUDIO ===

  app.get("/api/editor/check", isAuthenticated, async (req: any, res) => {
    try {
      const editorStatus = await storage.isEditor(req.user.id);
      res.json({ isEditor: editorStatus });
    } catch (error) {
      res.status(500).json({ message: "Failed to check editor status" });
    }
  });

  app.get(
    "/api/editor/overview",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const overview = await storage.getEditorOverview(req.user.id);
        res.json(overview);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editor overview" });
      }
    },
  );

  app.get(
    "/api/editor/garden-stream",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { genre, readiness, search, quiet } = req.query;
        const filters: any = {};
        if (genre && genre !== "all") filters.genre = genre;
        if (readiness && readiness !== "all") filters.readiness = readiness;
        if (search) filters.search = search;
        if (quiet === "true") filters.quiet = true;
        const stream = await storage.getEditorGardenStream(filters);
        res.json(stream);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch garden stream" });
      }
    },
  );

  app.get(
    "/api/editor/greenhouse",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entries = await storage.getGreenhouseEntries(req.user.id);
        res.json(entries);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch greenhouse entries" });
      }
    },
  );

  app.post(
    "/api/editor/greenhouse",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertGreenhouseEntrySchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const entry = await storage.addToGreenhouse(req.user.id, {
          writingId: parsed.data.writingId,
          issueId: parsed.data.issueId ?? undefined,
          themeFolder: parsed.data.themeFolder ?? undefined,
          priority: parsed.data.priority ?? undefined,
          internalNote: parsed.data.internalNote ?? undefined,
        });
        res.status(201).json(entry);
      } catch (error) {
        console.error("Failed to add to greenhouse:", error);
        res.status(500).json({ message: "Failed to add to greenhouse" });
      }
    },
  );

  app.patch(
    "/api/editor/greenhouse/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entry = await storage.updateGreenhouseEntry(
          req.user.id,
          req.params.id,
          req.body,
        );
        if (!entry) return res.status(404).json({ message: "Not found" });
        res.json(entry);
      } catch (error) {
        res.status(500).json({ message: "Failed to update greenhouse entry" });
      }
    },
  );

  app.delete(
    "/api/editor/greenhouse/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const removed = await storage.removeFromGreenhouse(
          req.user.id,
          req.params.id,
        );
        if (!removed) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Removed from greenhouse" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove from greenhouse" });
      }
    },
  );

  app.get(
    "/api/editor/requests",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { status } = req.query;
        const filters: any = { editorId: req.user.id };
        if (status) filters.status = status;
        const requests = await storage.getPublishRequests(filters);
        res.json(requests);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch publish requests" });
      }
    },
  );

  app.get("/api/author/requests", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getAuthorPublishRequests(
        req.user.id,
      );
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch author requests" });
    }
  });

  app.post(
    "/api/editor/requests",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertPublishRequestSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const request = await storage.createPublishRequest(
          req.user.id,
          {
            writingId: parsed.data.writingId,
            authorId: req.body.authorId,
            issueId: parsed.data.issueId ?? undefined,
            editorNote: parsed.data.editorNote ?? undefined,
            proposedDate: parsed.data.proposedDate ?? undefined,
            rightsDuration: parsed.data.rightsDuration ?? undefined,
            payment: parsed.data.payment ?? undefined,
          },
        );
        res.status(201).json(request);
      } catch (error) {
        res.status(500).json({ message: "Failed to create publish request" });
      }
    },
  );

  app.patch(
    "/api/author/requests/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = publishRequestResponseSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const request = await storage.respondToPublishRequest(
          req.user.id,
          req.params.id,
          parsed.data.status,
        );
        if (!request) return res.status(404).json({ message: "Not found" });
        res.json(request);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to respond to publish request" });
      }
    },
  );

  app.get(
    "/api/editor/requests/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const messages = await storage.getRequestMessages(req.params.id);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/editor/requests/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertRequestMessageSchema.safeParse({
          ...req.body,
          requestId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const message = await storage.createRequestMessage(
          req.user.id,
          { requestId: req.params.id, content: parsed.data.content },
        );
        res.status(201).json(message);
      } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.get(
    "/api/editor/issues",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const allIssues = await storage.getIssues();
        res.json(allIssues);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issues" });
      }
    },
  );

  app.get(
    "/api/editor/issues/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const issue = await storage.getIssue(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issue" });
      }
    },
  );

  app.post(
    "/api/editor/issues",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertIssueSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const issue = await storage.createIssue(req.user.id, {
          title: parsed.data.title,
          subtitle: parsed.data.subtitle ?? undefined,
          themeNote: parsed.data.themeNote ?? undefined,
          publishDate: parsed.data.publishDate
            ? new Date(parsed.data.publishDate)
            : undefined,
        });
        res.status(201).json(issue);
      } catch (error) {
        console.error("Failed to create issue:", error);
        res.status(500).json({ message: "Failed to create issue" });
      }
    },
  );

  app.patch(
    "/api/editor/issues/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const data: any = { ...req.body };
        if (data.publishDate) data.publishDate = new Date(data.publishDate);
        const issue = await storage.updateIssue(req.params.id, data);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to update issue" });
      }
    },
  );

  app.get(
    "/api/editor/issues/:id/pieces",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const pieces = await storage.getIssuePieces(req.params.id);
        res.json(pieces);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issue pieces" });
      }
    },
  );

  app.post(
    "/api/editor/issues/:id/pieces",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertIssuePieceSchema.safeParse({
          ...req.body,
          issueId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const piece = await storage.addPieceToIssue({
          issueId: req.params.id,
          writingId: parsed.data.writingId,
          sortOrder: parsed.data.sortOrder ?? undefined,
        });
        res.status(201).json(piece);
      } catch (error) {
        res.status(500).json({ message: "Failed to add piece to issue" });
      }
    },
  );

  app.patch(
    "/api/editor/issues/:id/pieces/:pieceId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const piece = await storage.updateIssuePiece(
          req.params.pieceId,
          req.body,
        );
        if (!piece) return res.status(404).json({ message: "Piece not found" });
        res.json(piece);
      } catch (error) {
        res.status(500).json({ message: "Failed to update piece" });
      }
    },
  );

  app.delete(
    "/api/editor/issues/:id/pieces/:pieceId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const removed = await storage.removePieceFromIssue(req.params.pieceId);
        if (!removed)
          return res.status(404).json({ message: "Piece not found" });
        res.json({ message: "Removed from issue" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove piece" });
      }
    },
  );

  app.post(
    "/api/editor/issues/:id/publish",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const issue = await storage.publishIssue(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to publish issue" });
      }
    },
  );

  app.get(
    "/api/editor/notes/:writingId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const notes = await storage.getEditorNotes(req.params.writingId);
        res.json(notes);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editor notes" });
      }
    },
  );

  app.post(
    "/api/editor/notes",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertEditorNoteSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const note = await storage.createEditorNote(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(note);
      } catch (error) {
        res.status(500).json({ message: "Failed to create editor note" });
      }
    },
  );

  app.delete(
    "/api/editor/notes/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteEditorNote(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete editor note" });
      }
    },
  );

  app.post(
    "/api/editor/promote",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { userId } = req.body;
        if (!userId)
          return res.status(400).json({ message: "userId is required" });
        await storage.setEditorRole(userId, "editor");
        res.json({ message: "User promoted to editor" });
      } catch (error) {
        res.status(500).json({ message: "Failed to promote user" });
      }
    },
  );

  // === CURATED OPPORTUNITIES ===
  app.get("/api/curated-opportunities", async (req, res) => {
    try {
      const items = await storage.getCuratedOpportunities();
      res.json(items);
    } catch (error) {
      console.error("Failed to get curated opportunities:", error);
      res.status(500).json({ message: "Failed to get curated opportunities" });
    }
  });

  app.post(
    "/api/editor/opportunities",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { title, link, outlet, deadline, payRate, genres, notes } =
          req.body;
        if (!title)
          return res.status(400).json({ message: "Title is required" });
        const item = await storage.createCuratedOpportunity(
          req.user.id,
          {
            title,
            link,
            outlet,
            deadline,
            payRate,
            genres,
            notes,
          },
        );
        res.status(201).json(item);
      } catch (error) {
        console.error("Failed to create curated opportunity:", error);
        res
          .status(500)
          .json({ message: "Failed to create curated opportunity" });
      }
    },
  );

  app.delete(
    "/api/editor/opportunities/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteCuratedOpportunity(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete curated opportunity" });
      }
    },
  );

  // === CIRCLE INTENTIONS ===
  app.get(
    "/api/circles/:circleId/intentions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getCircleIntentions(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get intentions" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/intentions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleIntentionSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createCircleIntention(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create intention" });
      }
    },
  );

  app.delete(
    "/api/circle-intentions/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteCircleIntention(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete intention" });
      }
    },
  );

  // === CIRCLE CELEBRATIONS ===
  app.get(
    "/api/circles/:circleId/celebrations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getCircleCelebrations(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get celebrations" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/celebrations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleCelebrationSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createCircleCelebration(
          req.user.id,
          {
            circleId: parsed.data.circleId,
            type: parsed.data.type,
            message: parsed.data.message ?? undefined,
            value: parsed.data.value ?? undefined,
          },
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create celebration" });
      }
    },
  );

  // === REJECTION WALL ===
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

  // === OPPORTUNITIES ===
  app.get("/api/opportunities", async (req: any, res) => {
    try {
      const items = await storage.getOpportunities();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get opportunities" });
    }
  });

  app.post("/api/opportunities", isAuthenticated, async (req: any, res) => {
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

  // === PROMPT POTLUCK ===
  app.get(
    "/api/circles/:circleId/potluck",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getPromptPotluckItems(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get potluck items" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/potluck",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertPromptPotluckSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createPromptPotluckItem(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create potluck item" });
      }
    },
  );

  app.delete("/api/potluck/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deletePromptPotluckItem(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete potluck item" });
    }
  });

  app.get(
    "/api/circles/:circleId/potluck/random",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.getRandomPotluckItem(req.params.circleId);
        if (!item)
          return res.status(404).json({ message: "No items in potluck" });
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to get random potluck item" });
      }
    },
  );

  // === QUIET READS ===
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
    "/api/writings/:id/whispers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const whispers = await storage.getQuietReadWhispers(req.params.id);
        res.json(whispers);
      } catch (error) {
        console.error("Error fetching whispers:", error);
        res.status(500).json({ message: "Failed to fetch whispers" });
      }
    },
  );

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

  // === IDEA DROPS ===
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

  app.get(
    "/api/writings/:id/export-docx",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== req.user.id)
          return res.status(403).json({ message: "Forbidden" });

        const user = await storage.getUser(req.user.id);
        const authorName = user?.firstName || "Author";
        const plainContent = (writing.content || "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        const words = plainContent.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const roundedCount = Math.round(wordCount / 100) * 100 || wordCount;
        const paragraphs = plainContent.split(/\n{2,}/).filter(Boolean);

        const headerParagraphs: Paragraph[] = [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 },
            children: [
              new TextRun({ text: authorName, font: "Courier New", size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 },
            children: [
              new TextRun({
                text: `Approx. ${roundedCount} words`,
                font: "Courier New",
                size: 24,
              }),
            ],
          }),
          ...Array(4)
            .fill(null)
            .map(() => new Paragraph({ spacing: { after: 0 }, children: [] })),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: writing.title || "Untitled",
                font: "Courier New",
                size: 24,
                bold: false,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `by ${authorName}`,
                font: "Courier New",
                size: 24,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 0 }, children: [] }),
        ];

        const bodyParagraphs = paragraphs.map(
          (p, i) =>
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 480, after: 0 },
              indent: i > 0 ? { firstLine: 720 } : undefined,
              children: [
                new TextRun({
                  text: p.replace(/\n/g, " ").trim(),
                  font: "Courier New",
                  size: 24,
                }),
              ],
            }),
        );

        const doc = new Document({
          sections: [
            {
              properties: {
                page: {
                  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                },
              },
              children: [...headerParagraphs, ...bodyParagraphs],
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        const filename = (writing.title || "untitled")
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 60);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.docx"`,
        );
        res.send(buffer);
      } catch (error) {
        res.status(500).json({ message: "Failed to export" });
      }
    },
  );

  // === PRESENCE ===
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

  // === PUBLIC GARDEN ===
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

  // === EDITORIAL FLAGS ===
  app.post("/api/editorial-flags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "writingId is required" });

      const call = await storage.getActiveSubmissionCall();
      const flagLimit = call ? call.flagLimit : 1;
      const activeCount = await storage.getActiveFlagCount(userId);
      if (activeCount >= flagLimit) {
        return res
          .status(400)
          .json({
            message: call
              ? `You can flag up to ${flagLimit} pieces during the Submission Call`
              : "You can only flag one piece at a time",
          });
      }

      const tier = await storage.getUserTier(userId);
      const isPaidFlag = tier === "paid";
      const flag = await storage.createEditorialFlag(
        userId,
        writingId,
        isPaidFlag,
      );
      res.status(201).json(flag);
    } catch (error) {
      console.error("Error creating editorial flag:", error);
      res.status(500).json({ message: "Failed to create flag" });
    }
  });

  app.get(
    "/api/editorial-flags/mine",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const flags = await storage.getMyFlags(req.user.id);
        res.json(flags);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch flags" });
      }
    },
  );

  app.get(
    "/api/editorial-feedback/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.writingId);
        if (!writing || writing.authorId !== userId)
          return res.status(404).json({ message: "Not found" });
        const notes = await storage.getEditorNotes(req.params.writingId);
        const flags = await storage.getMyFlags(userId);
        const flag = flags.find(
          (f: any) => f.writingId === req.params.writingId,
        );
        res.json({ notes, flag: flag || null });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editorial feedback" });
      }
    },
  );

  app.get(
    "/api/editor/flagged-queue",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const queue = await storage.getFlaggedQueue();
        res.json(queue);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch flagged queue" });
      }
    },
  );

  app.post(
    "/api/editor/flags/:id/seen",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const flag = await storage.markFlagSeen(
          req.params.id,
          req.user.id,
        );
        if (!flag) return res.status(404).json({ message: "Flag not found" });
        await storage.createNotification(flag.authorId, {
          type: "editor_paused",
          actorId: req.user.id,
          message: "An editor paused on your piece",
          writingId: flag.writingId,
        });
        res.json(flag);
      } catch (error) {
        res.status(500).json({ message: "Failed to mark flag as seen" });
      }
    },
  );

  app.post(
    "/api/editor/flags/:id/respond",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { response } = req.body;
        if (!response || typeof response !== "string")
          return res.status(400).json({ message: "response is required" });
        const flag = await storage.respondToFlag(
          req.params.id,
          req.user.id,
          response,
        );
        if (!flag) return res.status(404).json({ message: "Flag not found" });
        const noteType = response.startsWith("[Closed]")
          ? "decision"
          : "general_feedback";
        await storage.createEditorNote(req.user.id, {
          writingId: flag.writingId,
          content: response,
          noteType,
        });
        await storage.createNotification(flag.authorId, {
          type: "flag_response",
          actorId: req.user.id,
          message: response,
          writingId: flag.writingId,
        });
        res.json(flag);
      } catch (error) {
        res.status(500).json({ message: "Failed to respond to flag" });
      }
    },
  );

  // === EDITORS WALK ===
  app.get("/api/submission-calls/active", async (req, res) => {
    try {
      const call = await storage.getActiveSubmissionCall();
      res.json(call);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch active submission call" });
    }
  });

  // === TIER MANAGEMENT ===
  app.get("/api/user/tier", isAuthenticated, async (req: any, res) => {
    try {
      const tier = await storage.getUserTier(req.user.id);
      res.json({ tier });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tier" });
    }
  });

  // === MANUAL SNAPSHOTS ===
  app.post(
    "/api/writings/:id/snapshot",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const tier = await storage.getUserTier(userId);
        if (tier !== "paid")
          return res
            .status(403)
            .json({ message: "Manual snapshots are a Cultivator feature" });
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Forbidden" });

        const { note } = req.body;
        const wordCount = (writing.content || "")
          .replace(/<[^>]+>/g, "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        const snapshot = await storage.createSnapshot({
          writingId: writing.id,
          title: writing.title,
          content: writing.content,
          readiness: writing.readiness,
          wordCount,
          snapshotNote: note || undefined,
          isManual: true,
        });
        res.status(201).json(snapshot);
      } catch (error) {
        console.error("Error creating manual snapshot:", error);
        res.status(500).json({ message: "Failed to create snapshot" });
      }
    },
  );

  // === SMART SWAP MATCHING ===
  app.post(
    "/api/swaps/:id/smart-match",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const tier = await storage.getUserTier(req.user.id);
        if (tier !== "paid")
          return res
            .status(403)
            .json({ message: "Smart matching is a Cultivator feature" });
        const match = await storage.findSmartSwapMatch(req.params.id);
        if (!match)
          return res.json({
            match: null,
            message: "No compatible matches found yet",
          });

        const writing = await storage.getWriting(match.writingId);
        res.json({ match, writingTitle: writing?.title });
      } catch (error) {
        console.error("Error finding smart match:", error);
        res.status(500).json({ message: "Failed to find match" });
      }
    },
  );

  // === FIRST READER ===
  app.post("/api/first-reader", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertFirstReaderDropSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const drop = await storage.createFirstReaderDrop(req.user.id, {
        content: parsed.data.content,
        genre: parsed.data.genre ?? undefined,
      });
      res.status(201).json(drop);
    } catch (error) {
      res.status(500).json({ message: "Failed to create drop" });
    }
  });

  app.get("/api/first-reader", isAuthenticated, async (req: any, res) => {
    try {
      const genre = req.query.genre as string | undefined;
      const drops = await storage.getFirstReaderDrops(genre);
      const userId = req.user.id;
      res.json(drops.filter((d: any) => d.authorId !== userId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drops" });
    }
  });

  app.get("/api/first-reader/mine", isAuthenticated, async (req: any, res) => {
    try {
      const drops = await storage.getMyFirstReaderDrops(req.user.id);
      res.json(drops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch my drops" });
    }
  });

  app.post(
    "/api/first-reader/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertFirstReaderResponseSchema.safeParse({
          ...req.body,
          dropId: req.params.id,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const response = await storage.createFirstReaderResponse(
          req.user.id,
          {
            dropId: parsed.data.dropId,
            aliveSignal: parsed.data.aliveSignal,
            strikingLine: parsed.data.strikingLine ?? undefined,
            oneSuggestion: parsed.data.oneSuggestion ?? undefined,
          },
        );
        res.status(201).json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to respond" });
      }
    },
  );

  // === READING SHELF ===
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

  // === STRUGGLE SIGNALS ===
  app.get("/api/struggle-signals", isAuthenticated, async (req, res) => {
    try {
      const signals = await storage.getStruggleSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  app.get(
    "/api/editor/writer-profile/:authorId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const writings = await storage.getWriterProfileForEditor(
          req.params.authorId,
        );
        const user = await storage.getUser(req.params.authorId);
        res.json({
          writer: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                profileImageUrl: user.profileImageUrl,
              }
            : null,
          writings,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch writer profile" });
      }
    },
  );

  app.post(
    "/api/editor/handoff",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { writingId, targetEditorId, note } = req.body;
        if (!writingId || !targetEditorId)
          return res
            .status(400)
            .json({ message: "writingId and targetEditorId required" });
        await storage.createNotification(targetEditorId, {
          type: "editor_handoff",
          actorId: req.user.id,
          message: note || "An editor wants you to look at this piece",
          writingId,
        });
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to create handoff" });
      }
    },
  );

  app.get(
    "/api/editor/editors-list",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const editors = await storage.getEditors();
        res.json(editors.filter((e: any) => e.id !== req.user.id));
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editors" });
      }
    },
  );

  app.get(
    "/api/editor/greenhouse/all",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entries = await storage.getAllGreenhouseEntries();
        res.json(entries);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch all greenhouse entries" });
      }
    },
  );

  app.get(
    "/api/submission-calls/:id/queue",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const call = await storage.getSubmissionCall(req.params.id);
        if (!call)
          return res.status(404).json({ message: "Submission call not found" });
        const stream = await storage.getEditorGardenStream({
          readiness: "ready_to_show",
        });
        const flags = await storage.getFlaggedQueue();
        res.json({ call, stream, flags });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch submission call queue" });
      }
    },
  );

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

  // === COURSES ===

  app.get("/api/courses", async (req: any, res) => {
    try {
      const allCourses = await storage.getCourses();
      const userId = req.user?.claims?.sub;
      let accesses: string[] = [];
      let tier = "free";
      if (userId) {
        const userAccesses = await storage.getUserCourseAccesses(userId);
        accesses = userAccesses.map((a) => a.courseId);
        tier = await storage.getUserTier(userId);
      }
      const result = allCourses.map((c) => ({
        ...c,
        hasAccess:
          tier === "cultivator" && c.includedInCultivator
            ? true
            : accesses.includes(c.id),
        accessReason:
          tier === "cultivator" && c.includedInCultivator
            ? "cultivator"
            : accesses.includes(c.id)
              ? "purchased"
              : null,
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      const lessons = await storage.getCourseLessons(req.params.id);
      const userId = req.user?.claims?.sub;
      let hasAccess = false;
      let accessReason: string | null = null;
      let progress: any[] = [];
      if (userId) {
        const tier = await storage.getUserTier(userId);
        const purchased = await storage.hasUserCourseAccess(userId, course.id);
        hasAccess =
          (tier === "cultivator" && course.includedInCultivator) || purchased;
        accessReason =
          tier === "cultivator" && course.includedInCultivator
            ? "cultivator"
            : purchased
              ? "purchased"
              : null;
        if (hasAccess) {
          progress = await storage.getLessonProgress(userId, course.id);
        }
      }
      res.json({
        ...course,
        hasAccess,
        accessReason,
        lessons: lessons.map((l) => ({
          id: l.id,
          title: l.title,
          sortOrder: l.sortOrder,
          hasWritingPrompt: !!l.writingPrompt,
          completed: progress.some((p) => p.lessonId === l.id),
        })),
        completedCount: progress.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.get(
    "/api/courses/:courseId/lessons/:lessonId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const course = await storage.getCourse(req.params.courseId);
        if (!course)
          return res.status(404).json({ message: "Course not found" });
        const tier = await storage.getUserTier(userId);
        const purchased = await storage.hasUserCourseAccess(userId, course.id);
        const hasAccess =
          (tier === "cultivator" && course.includedInCultivator) || purchased;
        if (!hasAccess)
          return res
            .status(403)
            .json({ message: "You don't have access to this course" });
        const lesson = await storage.getCourseLesson(req.params.lessonId);
        if (!lesson || lesson.courseId !== course.id)
          return res.status(404).json({ message: "Lesson not found" });
        const progress = await storage.getLessonProgress(userId, course.id);
        const allLessons = await storage.getCourseLessons(course.id);
        const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
        res.json({
          ...lesson,
          completed: progress.some((p) => p.lessonId === lesson.id),
          prevLessonId:
            currentIndex > 0 ? allLessons[currentIndex - 1].id : null,
          nextLessonId:
            currentIndex < allLessons.length - 1
              ? allLessons[currentIndex + 1].id
              : null,
          totalLessons: allLessons.length,
          currentIndex: currentIndex + 1,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch lesson" });
      }
    },
  );

  app.post(
    "/api/courses/:courseId/purchase",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const course = await storage.getCourse(req.params.courseId);
        if (!course)
          return res.status(404).json({ message: "Course not found" });
        const access = await storage.grantCourseAccess(
          userId,
          course.id,
          "purchased",
        );
        res.json({ ok: true, access });
      } catch (error) {
        res.status(500).json({ message: "Failed to purchase course" });
      }
    },
  );

  app.post(
    "/api/courses/:courseId/lessons/:lessonId/complete",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const p = await storage.markLessonComplete(
          userId,
          req.params.lessonId,
          req.params.courseId,
        );
        res.json(p);
      } catch (error) {
        res.status(500).json({ message: "Failed to mark lesson complete" });
      }
    },
  );

  app.delete(
    "/api/courses/:courseId/lessons/:lessonId/complete",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        await storage.unmarkLessonComplete(userId, req.params.lessonId);
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to unmark lesson" });
      }
    },
  );

  app.post("/api/courses/seed", async (_req: any, res) => {
    try {
      const existing = await storage.getCourses();
      if (existing.length > 0)
        return res.json({
          message: "Courses already seeded",
          count: existing.length,
        });

      const { db: dbInst } = await import("./db");

      const [c1] = await dbInst
        .insert(courses)
        .values({
          title: "The Architecture of a Poem",
          description:
            "Explore how poems are built from the ground up. This course covers line breaks, stanza structure, rhythm, and how form shapes meaning. Ideal for poets who want to move beyond free verse or deepen their understanding of why poems look and sound the way they do.",
          instructor: "The Page Gallery",
          genre: "poetry",
          price: 12,
          includedInCultivator: true,
          isPublished: true,
          sortOrder: 1,
        })
        .returning();

      const [c2] = await dbInst
        .insert(courses)
        .values({
          title: "Writing the Lyric Essay",
          description:
            "The lyric essay lives at the intersection of poetry and prose. Learn to write essays that privilege image, rhythm, and associative leaps over linear argument. We'll study published examples and practice braiding, fragmentation, and the art of meaningful white space.",
          instructor: "The Page Gallery",
          genre: "essay",
          price: 15,
          includedInCultivator: true,
          isPublished: true,
          sortOrder: 2,
        })
        .returning();

      const [c3] = await dbInst
        .insert(courses)
        .values({
          title: "Revision as Discovery",
          description:
            "Revision isn't just fixing mistakes — it's a creative act. This course teaches you to see revision as a way to discover what your piece is really about. Through practical exercises and a structured revision process, you'll learn to transform rough drafts into polished work.",
          instructor: "The Page Gallery",
          genre: "craft",
          price: 10,
          includedInCultivator: true,
          isPublished: true,
          sortOrder: 3,
        })
        .returning();

      const poemLessons = [
        {
          courseId: c1.id,
          title: "Why Form Matters",
          content:
            "<h2>Why Form Matters</h2><p>Every poem has a form, even if that form is \"free.\" In this opening lesson, we explore the relationship between a poem's shape on the page and the experience of reading it.</p><p>Consider how a single word on a line creates emphasis. How a long, breathless sentence without line breaks creates urgency. How white space creates silence.</p><p>Form is not decoration — it is meaning. The way you break a line changes what a reader sees, hears, and feels.</p><h3>Key Concepts</h3><ul><li><strong>Line breaks</strong> control pacing and emphasis</li><li><strong>Stanza breaks</strong> create pauses and shifts</li><li><strong>Visual shape</strong> signals tone before a single word is read</li></ul><p>As you read poems this week, pay attention not just to <em>what</em> they say, but to <em>how they look</em> on the page. That shape is part of the poem's meaning.</p>",
          writingPrompt:
            "Take a paragraph you've written recently — any paragraph — and break it into lines. Try three different arrangements. How does each version change the feeling?",
          sortOrder: 1,
        },
        {
          courseId: c1.id,
          title: "The Line Break as Instrument",
          content:
            '<h2>The Line Break as Instrument</h2><p>The line break is the most powerful tool unique to poetry. Prose has sentences and paragraphs. Poetry has <em>lines</em>.</p><p>A line break can:</p><ul><li>Create suspense by splitting a phrase across two lines</li><li>Produce double meanings through enjambment</li><li>Control the reader\'s breath and rhythm</li><li>Emphasize the last word of a line (the "end-word")</li></ul><h3>Enjambment vs. End-Stop</h3><p>An <strong>end-stopped line</strong> completes a thought at the line break: <em>"The door was closed."</em></p><p>An <strong>enjambed line</strong> carries the thought across: <em>"The door was closed / but not locked."</em> Here, "closed" lands with finality — then the next line reverses it.</p><p>Master poets use this tension deliberately. Every line break is a tiny decision about meaning.</p>',
          writingPrompt:
            "Write a 10-line poem where every line break creates a small surprise or shift in meaning. Read each line alone before reading it with the next.",
          sortOrder: 2,
        },
        {
          courseId: c1.id,
          title: "Stanza and Breath",
          content:
            '<h2>Stanza and Breath</h2><p>The word "stanza" comes from the Italian for "room." Each stanza is a room in your poem — a contained space with its own atmosphere.</p><p>Stanza breaks create silence on the page. They tell the reader: pause here. Let what you just read settle.</p><h3>Common Stanza Forms</h3><ul><li><strong>Couplets</strong> (2 lines): Intimate, paired, conversational</li><li><strong>Tercets</strong> (3 lines): Dynamic, restless, forward-moving</li><li><strong>Quatrains</strong> (4 lines): Balanced, stable, traditional</li><li><strong>Irregular stanzas</strong>: Organic, following the poem\'s natural breath</li></ul><p>There are no rules about which to use. But your choice should be deliberate. A poem in couplets feels different from the same poem in one block — even if the words are identical.</p>',
          writingPrompt:
            "Take a poem you've written and restructure it into couplets, then tercets, then one continuous block. Which version serves the poem best? Write a brief note about why.",
          sortOrder: 3,
        },
        {
          courseId: c1.id,
          title: "Sound and Rhythm",
          content:
            '<h2>Sound and Rhythm</h2><p>Poetry is an oral art. Even when read silently, poems activate the reader\'s inner voice. Sound is not separate from meaning — it <em>is</em> meaning.</p><h3>Tools of Sound</h3><ul><li><strong>Alliteration</strong>: Repeated initial consonants (<em>"the slow, soft sound"</em>)</li><li><strong>Assonance</strong>: Repeated vowel sounds (<em>"the low moan of the old road"</em>)</li><li><strong>Consonance</strong>: Repeated consonant sounds (<em>"the click of the clock"</em>)</li><li><strong>Internal rhyme</strong>: Rhyme within a line, not just at the end</li></ul><p>Rhythm emerges from the interplay of stressed and unstressed syllables. You don\'t need to write in strict meter, but you should <em>hear</em> the rhythm of your lines.</p><p>Read your poems aloud. Always. Your ear will catch what your eye misses.</p>',
          writingPrompt:
            "Write a short poem (8-12 lines) that uses sound as its primary organizing principle. Choose a dominant sound — a vowel or consonant — and let it recur throughout. Don't force rhyme; let the sound guide you.",
          sortOrder: 4,
        },
        {
          courseId: c1.id,
          title: "Putting It All Together",
          content:
            "<h2>Putting It All Together</h2><p>You now have four tools: line breaks, stanza structure, sound, and rhythm. The art of poetry is knowing when and how to use each one.</p><p>Great poems don't use every tool at once. They make choices. A spare, quiet poem might rely on line breaks and white space. A musical poem might prioritize sound and rhythm. A narrative poem might use stanzas like paragraphs.</p><h3>Your Process</h3><ol><li>Write the first draft without worrying about form</li><li>Read it aloud and listen for its natural rhythm</li><li>Experiment with line breaks — where does the poem want to pause?</li><li>Try different stanza structures</li><li>Polish the sounds — remove any that clash with the poem's tone</li></ol><p>Form is not a cage. It is a garden trellis — something for the poem to grow on.</p>",
          writingPrompt:
            "Write a poem of 16-20 lines that consciously uses at least three of the tools from this course. After writing, annotate it: mark where you made deliberate choices about line breaks, stanza structure, sound, or rhythm.",
          sortOrder: 5,
        },
      ];

      const essayLessons = [
        {
          courseId: c2.id,
          title: "What Is a Lyric Essay?",
          content:
            "<h2>What Is a Lyric Essay?</h2><p>The lyric essay is a hybrid form — it borrows from poetry's attention to language and image while maintaining prose's capacity for exploration and argument.</p><p>Unlike a traditional essay, the lyric essay doesn't follow a linear path from thesis to evidence to conclusion. Instead, it moves by association, circling its subject, approaching from multiple angles.</p><h3>Characteristics</h3><ul><li>Emphasis on <strong>image</strong> over argument</li><li><strong>White space</strong> as structural element</li><li><strong>Fragmentation</strong> — sections that don't connect obviously but resonate</li><li><strong>Braiding</strong> — weaving multiple threads</li><li>A willingness to <strong>not know</strong> the answer</li></ul><p>The lyric essay trusts the reader to make connections. It is generous in its ambiguity.</p>",
          writingPrompt:
            "Write a one-page piece about a place that matters to you. Don't explain why it matters. Instead, describe it in precise, sensory detail. Let the images carry the emotion.",
          sortOrder: 1,
        },
        {
          courseId: c2.id,
          title: "The Art of Braiding",
          content:
            "<h2>The Art of Braiding</h2><p>Braiding is the technique of weaving two or more seemingly unrelated threads through an essay, allowing them to illuminate each other through proximity.</p><p>For example, an essay might alternate between:</p><ul><li>A memory of learning to swim</li><li>Research about the physics of buoyancy</li><li>A meditation on trust</li></ul><p>No thread explains the others. But together, they create a meaning that none could achieve alone.</p><h3>How to Braid</h3><ol><li>Identify 2-3 threads that feel connected to you, even if you can't explain why</li><li>Write each thread separately first</li><li>Cut each thread into fragments</li><li>Arrange the fragments, alternating threads</li><li>Let the juxtapositions create new meaning</li></ol>",
          writingPrompt:
            "Choose two subjects that seem unrelated (e.g., your grandmother's kitchen and the migration patterns of birds). Write about each for 10 minutes. Then weave them together, alternating paragraphs. What emerges in the space between them?",
          sortOrder: 2,
        },
        {
          courseId: c2.id,
          title: "Fragment and White Space",
          content:
            "<h2>Fragment and White Space</h2><p>In the lyric essay, what you leave out is as important as what you include. White space — the gaps between sections — is not emptiness. It is silence, breath, invitation.</p><p>Fragmentation is the art of breaking a continuous narrative into pieces and trusting the reader to assemble meaning from the arrangement.</p><h3>Types of Fragmentation</h3><ul><li><strong>Numbered sections</strong>: Creates a sense of accumulation</li><li><strong>Titled sections</strong>: Each fragment becomes a small room</li><li><strong>Untitled breaks</strong>: The most open, most ambiguous</li><li><strong>Single-sentence sections</strong>: Maximum emphasis</li></ul><p>White space asks the reader to participate. It says: <em>something happened here that I cannot or will not say. Fill it with your own understanding.</em></p>",
          writingPrompt:
            "Write about a difficult experience in exactly 7 numbered fragments. Each fragment should be no more than 3 sentences. Let the white space between fragments do the emotional work.",
          sortOrder: 3,
        },
        {
          courseId: c2.id,
          title: "Image as Argument",
          content:
            '<h2>Image as Argument</h2><p>In a lyric essay, you don\'t argue with logic. You argue with images. A precisely rendered image can carry more conviction than any thesis statement.</p><p>This is the poet\'s gift to the essayist: the understanding that a well-chosen detail can stand for an entire worldview.</p><h3>The Objective Correlative</h3><p>T.S. Eliot called this the "objective correlative" — an object or image that evokes a specific emotion without naming it.</p><p>Instead of writing "I was lonely," you write: "The kitchen table had four chairs but only one placemat."</p><p>The image does the work. The reader feels the loneliness without being told to.</p>',
          writingPrompt:
            "Write a 500-word essay about an emotion without ever naming the emotion. Use only images, objects, and sensory details. See if a reader can identify the feeling from the images alone.",
          sortOrder: 4,
        },
      ];

      const revisionLessons = [
        {
          courseId: c3.id,
          title: "Seeing Your Draft Freshly",
          content:
            "<h2>Seeing Your Draft Freshly</h2><p>The hardest part of revision is seeing what's actually on the page instead of what you intended to put there. Your brain fills in gaps, smooths over rough transitions, and hears rhythms that aren't there yet.</p><h3>Techniques for Fresh Eyes</h3><ul><li><strong>Time</strong>: Put the draft away for at least 24 hours</li><li><strong>Format change</strong>: Print it, change the font, or read it on your phone</li><li><strong>Read aloud</strong>: Your ear catches what your eye skips</li><li><strong>Read backward</strong>: Start from the last paragraph and work up</li><li><strong>Ask someone else</strong>: A reader who doesn't know your intentions</li></ul><p>Revision begins with honest seeing. Before you can improve a piece, you must understand what it actually is — not what you hoped it would be.</p>",
          writingPrompt:
            "Take a piece you wrote at least a week ago. Read it aloud and mark every place where you stumble, pause, or feel uncertain. Those marks are your revision map.",
          sortOrder: 1,
        },
        {
          courseId: c3.id,
          title: "Finding the Real Subject",
          content:
            "<h2>Finding the Real Subject</h2><p>Most first drafts are about finding out what you want to say. The real subject often appears in the last paragraph — the place where you finally arrived at what matters.</p><h3>The Iceberg Principle</h3><p>Hemingway said that if a writer knows something well enough, they can omit it and the reader will still feel it. Your first draft is the research. Your revision is the iceberg — finding what to keep above water and what to submerge.</p><p>Look for:</p><ul><li>The sentence that surprises you</li><li>The image that keeps returning</li><li>The question you're circling but haven't asked directly</li><li>The place where the energy shifts</li></ul><p>Often, the real piece begins where the draft gets uncomfortable or unexpected.</p>",
          writingPrompt:
            "Read through a draft and highlight the three sentences that feel most alive, surprising, or true. Now write a new draft that starts from one of those sentences. Let the discovery lead.",
          sortOrder: 2,
        },
        {
          courseId: c3.id,
          title: "Structural Revision",
          content:
            "<h2>Structural Revision</h2><p>Before polishing sentences, look at the larger architecture. Does the piece move in the right direction? Does it earn its ending?</p><h3>Questions for Structure</h3><ul><li>What is the <strong>first line</strong> doing? Does it earn the reader's attention?</li><li>Where does the piece <strong>sag</strong>? Mark any section where your attention drifts</li><li>Is the <strong>ending</strong> where the piece arrives, or where you ran out of things to say?</li><li>Could any section be <strong>cut entirely</strong> without losing meaning?</li><li>What happens if you <strong>rearrange</strong> the sections?</li></ul><p>Be ruthless about cutting. Every word should earn its place. A shorter, tighter piece is almost always stronger than a longer, looser one.</p>",
          writingPrompt:
            "Take a piece and outline it — one sentence per paragraph or section. Now rearrange the outline into a different order. Try at least two arrangements. Which one creates the most tension or surprise?",
          sortOrder: 3,
        },
        {
          courseId: c3.id,
          title: "Sentence-Level Craft",
          content:
            '<h2>Sentence-Level Craft</h2><p>Once the structure is solid, turn to the sentences themselves. Good prose is built one sentence at a time.</p><h3>What to Look For</h3><ul><li><strong>Verb strength</strong>: Replace "was" + adjective with a specific verb. "She was angry" → "She slammed the door."</li><li><strong>Unnecessary words</strong>: Cut "very," "really," "just," "that" (when possible)</li><li><strong>Sentence variety</strong>: Mix short and long. A short sentence after a long one creates emphasis.</li><li><strong>Specificity</strong>: "Bird" → "starling." "Tree" → "silver birch." "Said" → sometimes just "said" is best.</li><li><strong>Sound</strong>: Read aloud. Does the prose have rhythm?</li></ul><p>Don\'t edit for style before you\'ve edited for truth. Make it honest first, then make it beautiful.</p>',
          writingPrompt:
            "Choose a paragraph from your work and revise it three times: once for verbs (make every verb as specific as possible), once for cuts (remove every unnecessary word), and once for sound (read aloud and adjust for rhythm).",
          sortOrder: 4,
        },
      ];

      await dbInst
        .insert(courseLessons)
        .values([...poemLessons, ...essayLessons, ...revisionLessons]);

      res.json({ message: "Courses seeded successfully", count: 3 });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to seed courses", error: error.message });
    }
  });

  // === COURSE RATINGS ===
  app.get("/api/courses/:courseId/ratings", async (req: any, res) => {
    try {
      const ratings = await storage.getCourseRatings(req.params.courseId);
      const avg = await storage.getCourseAverageRating(req.params.courseId);
      res.json({ ratings, average: avg.average, count: avg.count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get(
    "/api/courses/:courseId/my-rating",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const rating = await storage.getUserCourseRating(
          userId,
          req.params.courseId,
        );
        res.json(rating);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch your rating" });
      }
    },
  );

  app.post(
    "/api/courses/:courseId/ratings",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { rating, review } = req.body;
        if (!rating || rating < 1 || rating > 5)
          return res
            .status(400)
            .json({ message: "Rating must be between 1 and 5" });
        const hasAccess = await storage.hasUserCourseAccess(
          userId,
          req.params.courseId,
        );
        const user = await storage.getUser(userId);
        const isCultivator = user?.tier === "cultivator";
        const course = await storage.getCourse(req.params.courseId);
        if (!course)
          return res.status(404).json({ message: "Course not found" });
        if (!hasAccess && !(isCultivator && course.includedInCultivator)) {
          return res
            .status(403)
            .json({ message: "You must have access to the course to rate it" });
        }
        const result = await storage.upsertCourseRating(
          userId,
          req.params.courseId,
          rating,
          review,
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to save rating" });
      }
    },
  );

  // === EXERCISE RESPONSES ===
  async function verifyCourseAccess(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const course = await storage.getCourse(courseId);
    if (!course) return { ok: false, message: "Course not found" };
    const lesson = await storage.getCourseLesson(lessonId);
    if (!lesson || lesson.courseId !== courseId)
      return { ok: false, message: "Lesson not found in this course" };
    const purchased = await storage.hasUserCourseAccess(userId, courseId);
    const user = await storage.getUser(userId);
    const isCultivator = user?.tier === "cultivator";
    if (!purchased && !(isCultivator && course.includedInCultivator)) {
      return { ok: false, message: "You don't have access to this course" };
    }
    return { ok: true };
  }

  app.get(
    "/api/courses/:courseId/lessons/:lessonId/exercise",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const access = await verifyCourseAccess(
          userId,
          req.params.courseId,
          req.params.lessonId,
        );
        if (!access.ok)
          return res.status(403).json({ message: access.message });
        const response = await storage.getExerciseResponse(
          userId,
          req.params.lessonId,
        );
        res.json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch exercise response" });
      }
    },
  );

  app.post(
    "/api/courses/:courseId/lessons/:lessonId/exercise",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const access = await verifyCourseAccess(
          userId,
          req.params.courseId,
          req.params.lessonId,
        );
        if (!access.ok)
          return res.status(403).json({ message: access.message });
        const { content } = req.body;
        if (typeof content !== "string")
          return res.status(400).json({ message: "Content is required" });
        const result = await storage.saveExerciseResponse(
          userId,
          req.params.courseId,
          req.params.lessonId,
          content,
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to save exercise response" });
      }
    },
  );

  app.post(
    "/api/courses/:courseId/lessons/:lessonId/save-to-garden",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const access = await verifyCourseAccess(
          userId,
          req.params.courseId,
          req.params.lessonId,
        );
        if (!access.ok)
          return res.status(403).json({ message: access.message });
        const { title } = req.body;
        if (!title || typeof title !== "string")
          return res.status(400).json({ message: "Title is required" });
        const result = await storage.saveExerciseToGarden(
          userId,
          req.params.courseId,
          req.params.lessonId,
          title,
        );
        res.json(result);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to save to garden" });
      }
    },
  );

  // === CHALLENGES ===
  app.get("/api/challenges", async (_req, res) => {
    try {
      const allChallenges = await storage.getChallenges();
      const now = new Date();
      const withStatus = allChallenges.map((c) => {
        let computedStatus = c.status;
        if (now < c.startsAt) computedStatus = "upcoming";
        else if (now >= c.startsAt && now <= c.endsAt) computedStatus = "open";
        else if (c.votingEndsAt && now > c.endsAt && now <= c.votingEndsAt)
          computedStatus = "voting";
        else computedStatus = "closed";
        return { ...c, status: computedStatus };
      });
      res.json(withStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      let computedStatus = challenge.status;
      if (now < challenge.startsAt) computedStatus = "upcoming";
      else if (now >= challenge.startsAt && now <= challenge.endsAt)
        computedStatus = "open";
      else if (
        challenge.votingEndsAt &&
        now > challenge.endsAt &&
        now <= challenge.votingEndsAt
      )
        computedStatus = "voting";
      else computedStatus = "closed";
      res.json({ ...challenge, status: computedStatus });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/entries", async (req, res) => {
    try {
      const entries = await storage.getChallengeEntries(req.params.id);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/entries", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      if (now < challenge.startsAt || now > challenge.endsAt) {
        return res
          .status(400)
          .json({
            message: "This challenge is not currently accepting entries",
          });
      }
      const { title, content, writingId } = req.body;
      if (!title || !content)
        return res
          .status(400)
          .json({ message: "Title and content are required" });
      if (challenge.wordLimit) {
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount > challenge.wordLimit) {
          return res
            .status(400)
            .json({
              message: `Entry exceeds word limit of ${challenge.wordLimit} words`,
            });
        }
      }
      const entry = await storage.submitChallengeEntry(
        (req.user as any).claims.sub,
        {
          challengeId: req.params.id,
          title,
          content,
          writingId,
        },
      );
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/challenges/:id/entries/:entryId", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.withdrawChallengeEntry(
        (req.user as any).claims.sub,
        req.params.entryId,
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/my-entry", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const entry = await storage.getUserChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
      );
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/votes", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      const isVotingOpen =
        (challenge.votingEndsAt &&
          now > challenge.endsAt &&
          now <= challenge.votingEndsAt) ||
        (now >= challenge.startsAt && now <= challenge.endsAt);
      if (!isVotingOpen)
        return res
          .status(400)
          .json({ message: "Voting is not open for this challenge" });
      const { entryId } = req.body;
      if (!entryId)
        return res.status(400).json({ message: "Entry ID is required" });
      const vote = await storage.voteChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
        entryId,
      );
      res.json(vote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/challenges/:id/votes/:entryId", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.unvoteChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
        req.params.entryId,
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/my-votes", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const votes = await storage.getUserChallengeVotes(
        (req.user as any).claims.sub,
        req.params.id,
      );
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === PAUSE STONES ===
  app.post(
    "/api/writings/:id/pause-stone",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const stone = await storage.addPauseStone(req.params.id, userId);
        res.status(201).json(stone);
      } catch (error) {
        console.error("Error adding pause stone:", error);
        res.status(500).json({ message: "Failed to add pause stone" });
      }
    },
  );

  app.get("/api/writings/:id/pause-stones", async (req: any, res) => {
    try {
      const count = await storage.getPauseStoneCount(req.params.id);
      const hasPlaced = req.user?.claims?.sub
        ? await storage.hasUserPausedStone(req.params.id, req.user.id)
        : false;
      res.json({ count, hasPlaced });
    } catch (error) {
      console.error("Error fetching pause stones:", error);
      res.status(500).json({ message: "Failed to fetch pause stones" });
    }
  });

  app.post("/api/writings/pause-stone-counts", async (req, res) => {
    try {
      const { writingIds } = req.body;
      if (!Array.isArray(writingIds))
        return res.status(400).json({ message: "writingIds array required" });
      const counts = await storage.getPauseStoneCounts(writingIds);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching pause stone counts:", error);
      res.status(500).json({ message: "Failed to fetch pause stone counts" });
    }
  });

  // === COMPOST ENHANCEMENTS ===
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

  // === GARDEN PRESENCE ===
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

  // === GARDEN SEASONS ===
  app.get("/api/garden/season", async (req, res) => {
    try {
      const season = await storage.getCurrentSeason();
      res.json(season);
    } catch (error) {
      console.error("Error fetching current season:", error);
      res.status(500).json({ message: "Failed to fetch current season" });
    }
  });

  // === LIVE PROMPT COUNTS ===
  app.get("/api/community/live-counts", async (req, res) => {
    try {
      const counts = await storage.getLivePromptCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching live counts:", error);
      res.status(500).json({ message: "Failed to fetch live counts" });
    }
  });

  // === EDITOR-IN-CHIEF (EIC) ===
  app.post("/api/eic/invite-editor", isEditorInChief, async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string")
        return res.status(400).json({ message: "Email is required" });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim()))
        return res
          .status(400)
          .json({ message: "Please enter a valid email address" });
      const existing = await storage.getEditorInvitations();
      const duplicate = existing.find(
        (inv) =>
          inv.email === email.trim() &&
          inv.status === "pending" &&
          new Date(inv.expiresAt) > new Date(),
      );
      if (duplicate)
        return res
          .status(400)
          .json({
            message: "An active invitation already exists for this email",
          });
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invitation = await storage.createEditorInvitation({
        email: email.trim(),
        token,
        invitedBy: req.user.id,
        expiresAt,
      });
      res.json(invitation);
    } catch (error) {
      console.error("Error creating editor invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/eic/invitations", isEditorInChief, async (req: any, res) => {
    try {
      const invitations = await storage.getEditorInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.get("/api/eic/editors", isEditorInChief, async (req: any, res) => {
    try {
      const editors = await storage.getEditors();
      res.json(editors);
    } catch (error) {
      console.error("Error fetching editors:", error);
      res.status(500).json({ message: "Failed to fetch editors" });
    }
  });

  app.get("/api/editor-onboarding/validate", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ message: "Token is required" });
      const invitation = await storage.getEditorInvitationByToken(token);
      if (!invitation)
        return res.json({ valid: false, reason: "Invalid invitation token" });
      if (invitation.status === "accepted")
        return res.json({
          valid: false,
          reason: "This invitation has already been used",
        });
      if (new Date() > invitation.expiresAt)
        return res.json({
          valid: false,
          reason: "This invitation has expired",
        });
      res.json({ valid: true, email: invitation.email });
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  app.post(
    "/api/editor-onboarding/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { token } = req.body;
        if (!token)
          return res.status(400).json({ message: "Token is required" });
        const invitation = await storage.getEditorInvitationByToken(token);
        if (!invitation)
          return res.status(404).json({ message: "Invalid invitation token" });
        if (invitation.status === "accepted")
          return res
            .status(400)
            .json({ message: "This invitation has already been used" });
        if (new Date() > invitation.expiresAt)
          return res
            .status(400)
            .json({ message: "This invitation has expired" });
        const userId = req.user.id;
        await storage.acceptEditorInvitation(token, userId);
        res.json({
          success: true,
          message: "Welcome to the Editorial Studio!",
        });
      } catch (error) {
        console.error("Error accepting invitation:", error);
        res.status(500).json({ message: "Failed to accept invitation" });
      }
    },
  );

  // === EIC STUDIO - SUPER ROBUST OVERVIEW FOR SOPHIA ===

  // EIC Studio: Get all raw seeds (unpublished writings with readiness raw_seed)
  app.get("/api/eic/raw-seeds", isEditorInChief, async (req: any, res) => {
    try {
      const rawSeeds = await db.select({
        id: writings.id,
        title: writings.title,
        content: writings.content,
        stage: writings.stage,
        genre: writings.genre,
        readiness: writings.readiness,
        visibility: writings.visibility,
        editorialAvailable: writings.editorialAvailable,
        isPublished: writings.isPublished,
        createdAt: writings.createdAt,
        updatedAt: writings.updatedAt,
        authorId: writings.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(eq(writings.readiness, "raw_seed"))
        .orderBy(desc(writings.createdAt));
      res.json(rawSeeds);
    } catch (error) {
      console.error("Error fetching raw seeds:", error);
      res.status(500).json({ message: "Failed to fetch raw seeds" });
    }
  });

  // EIC Studio: Get all unsaved/draft writings (not published, not editorial available)
  app.get("/api/eic/unsaved-drafts", isEditorInChief, async (req: any, res) => {
    try {
      const drafts = await db.select({
        id: writings.id,
        title: writings.title,
        content: writings.content,
        stage: writings.stage,
        genre: writings.genre,
        readiness: writings.readiness,
        visibility: writings.visibility,
        editorialAvailable: writings.editorialAvailable,
        isPublished: writings.isPublished,
        isPublicGarden: writings.isPublicGarden,
        createdAt: writings.createdAt,
        updatedAt: writings.updatedAt,
        authorId: writings.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(
          and(
            eq(writings.isPublished, false),
            eq(writings.editorialAvailable, false),
            eq(writings.isPublicGarden, false)
          )
        )
        .orderBy(desc(writings.updatedAt));
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching unsaved drafts:", error);
      res.status(500).json({ message: "Failed to fetch unsaved drafts" });
    }
  });

  // EIC Studio: Per-user usage/engagement stats
  app.get("/api/eic/user-activity", isEditorInChief, async (req: any, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));

      const userActivity = await Promise.all(allUsers.map(async (u) => {
        const [writingsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(writings).where(eq(writings.authorId, u.id));
        const [publishedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(writings).where(and(eq(writings.authorId, u.id), eq(writings.isPublished, true)));
        const [rawSeedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(writings).where(and(eq(writings.authorId, u.id), eq(writings.readiness, "raw_seed")));
        const [editorialCount] = await db.select({ count: sql<number>`count(*)::int` }).from(writings).where(and(eq(writings.authorId, u.id), eq(writings.editorialAvailable, true)));
        const [ritualCount] = await db.select({ count: sql<number>`count(*)::int` }).from(ritualSessions).where(eq(ritualSessions.userId, u.id));
        const [weatherCount] = await db.select({ count: sql<number>`count(*)::int` }).from(innerWeather).where(eq(innerWeather.userId, u.id));
        const [reflectionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(reflections).where(eq(reflections.userId, u.id));
        const [journalCount] = await db.select({ count: sql<number>`count(*)::int` }).from(growthJournalEntries).where(eq(growthJournalEntries.userId, u.id));
        const [pollinationCount] = await db.select({ count: sql<number>`count(*)::int` }).from(pollinations).where(eq(pollinations.fromUserId, u.id));
        const [savedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(savedPieces).where(eq(savedPieces.userId, u.id));
        const [lastWriting] = await db.select({ updatedAt: writings.updatedAt }).from(writings).where(eq(writings.authorId, u.id)).orderBy(desc(writings.updatedAt)).limit(1);

        return {
          ...u,
          totalWritings: writingsCount?.count || 0,
          publishedWritings: publishedCount?.count || 0,
          rawSeeds: rawSeedCount?.count || 0,
          editorialAvailable: editorialCount?.count || 0,
          ritualSessions: ritualCount?.count || 0,
          innerWeatherEntries: weatherCount?.count || 0,
          reflections: reflectionCount?.count || 0,
          journalEntries: journalCount?.count || 0,
          pollinations: pollinationCount?.count || 0,
          savedPieces: savedCount?.count || 0,
          lastActivity: lastWriting?.updatedAt || u.createdAt,
        };
      }));
      res.json(userActivity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // EIC Studio: Get single writing content for EIC preview
  app.get("/api/eic/writing/:id", isEditorInChief, async (req: any, res) => {
    try {
      const [writing] = await db.select({
        id: writings.id,
        title: writings.title,
        content: writings.content,
        stage: writings.stage,
        genre: writings.genre,
        readiness: writings.readiness,
        visibility: writings.visibility,
        editorialAvailable: writings.editorialAvailable,
        isPublished: writings.isPublished,
        isPublicGarden: writings.isPublicGarden,
        galleryOptIn: writings.galleryOptIn,
        tags: writings.tags,
        createdAt: writings.createdAt,
        updatedAt: writings.updatedAt,
        authorId: writings.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(eq(writings.id, req.params.id));
      if (!writing) return res.status(404).json({ message: "Writing not found" });
      res.json(writing);
    } catch (error) {
      console.error("Error fetching writing:", error);
      res.status(500).json({ message: "Failed to fetch writing" });
    }
  });

  // EIC Studio: Recent activity feed across all users
  app.get("/api/eic/activity-feed", isEditorInChief, async (req: any, res) => {
    try {
      const recentWritings = await db.select({
        id: writings.id,
        title: writings.title,
        readiness: writings.readiness,
        isPublished: writings.isPublished,
        editorialAvailable: writings.editorialAvailable,
        createdAt: writings.createdAt,
        updatedAt: writings.updatedAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .orderBy(desc(writings.updatedAt))
        .limit(50);

      const recentRituals = await db.select({
        id: ritualSessions.id,
        durationMinutes: ritualSessions.durationMinutes,
        completedAt: ritualSessions.completedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      }).from(ritualSessions)
        .leftJoin(users, eq(ritualSessions.userId, users.id))
        .orderBy(desc(ritualSessions.completedAt))
        .limit(20);

      const recentWeather = await db.select({
        id: innerWeather.id,
        mood: innerWeather.mood,
        energy: innerWeather.energy,
        createdAt: innerWeather.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      }).from(innerWeather)
        .leftJoin(users, eq(innerWeather.userId, users.id))
        .orderBy(desc(innerWeather.createdAt))
        .limit(20);

      res.json({
        recentWritings,
        recentRituals,
        recentWeather,
      });
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

    // EIC: Update user role
  app.post("/api/eic/update-role", isEditorInChief, async (req: any, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ message: "userId and role are required" });
      }
      const validRoles = ["writer", "editor", "editor_in_chief"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.setEditorRole(userId, role);
      res.json({ success: true, userId, role });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  
  // === EXHIBITS ===
  app.get("/api/exhibits", async (req: any, res) => {
    try {
      const allExhibits = await storage.getExhibits();
      const userId = req.user?.claims?.sub;
      if (userId) {
        const withStatus = await Promise.all(
          allExhibits.map(async (exhibit) => {
            const purchased = await storage.hasExhibitPurchase(
              userId,
              exhibit.id,
            );
            const progress = await storage.getExhibitProgress(
              userId,
              exhibit.id,
            );
            let status: "locked" | "available" | "in_progress" | "completed" =
              exhibit.price > 0 && !purchased ? "locked" : "available";
            if (progress) {
              status = progress.completedAt ? "completed" : "in_progress";
            }
            return {
              ...exhibit,
              purchased,
              status,
              currentScreen: progress?.currentScreen || null,
            };
          }),
        );
        return res.json(withStatus);
      }
      res.json(
        allExhibits.map((e) => ({
          ...e,
          purchased: false,
          status: e.price > 0 ? "locked" : "available",
          currentScreen: null,
        })),
      );
    } catch (error) {
      console.error("Error fetching exhibits:", error);
      res.status(500).json({ message: "Failed to fetch exhibits" });
    }
  });

  app.get("/api/exhibits/:slug", async (req: any, res) => {
    try {
      const exhibit = await storage.getExhibitBySlug(req.params.slug);
      if (!exhibit || !exhibit.isPublished)
        return res.status(404).json({ message: "Exhibit not found" });
      const userId = req.user?.claims?.sub;
      const purchased = userId
        ? await storage.hasExhibitPurchase(userId, exhibit.id)
        : false;
      res.json({ ...exhibit, purchased });
    } catch (error) {
      console.error("Error fetching exhibit:", error);
      res.status(500).json({ message: "Failed to fetch exhibit" });
    }
  });

  app.post(
    "/api/exhibits/:slug/purchase",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit)
          return res.status(404).json({ message: "Exhibit not found" });
        const alreadyPurchased = await storage.hasExhibitPurchase(
          userId,
          exhibit.id,
        );
        if (alreadyPurchased)
          return res.json({ message: "Already purchased", purchased: true });
        const purchase = await storage.createExhibitPurchase(
          userId,
          exhibit.id,
        );
        res.status(201).json(purchase);
      } catch (error) {
        console.error("Error purchasing exhibit:", error);
        res.status(500).json({ message: "Failed to purchase exhibit" });
      }
    },
  );

  app.get(
    "/api/exhibits/:slug/progress",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const progress = await storage.getExhibitProgress(userId, exhibit.id);
        res.json(
          progress || {
            currentScreen: 1,
            completedExercises: [],
            completedAt: null,
          },
        );
      } catch (error) {
        console.error("Error fetching exhibit progress:", error);
        res.status(500).json({ message: "Failed to fetch progress" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/progress",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const { currentScreen, completedExercises, completedAt } = req.body;
        const progressSchema = z.object({
          currentScreen: z.number().int().min(1).optional(),
          completedExercises: z.array(z.string()).optional(),
          completedAt: z.string().nullable().optional(),
        });
        const parsed = progressSchema.safeParse({
          currentScreen,
          completedExercises,
          completedAt,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const progress = await storage.upsertExhibitProgress(
          userId,
          exhibit.id,
          {
            currentScreen: parsed.data.currentScreen,
            completedExercises: parsed.data.completedExercises,
            completedAt: parsed.data.completedAt
              ? new Date(parsed.data.completedAt)
              : undefined,
          },
        );
        res.json(progress);
      } catch (error) {
        console.error("Error updating exhibit progress:", error);
        res.status(500).json({ message: "Failed to update progress" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const parsed = insertExhibitResponseSchema.safeParse({
          ...req.body,
          exhibitId: exhibit.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.saveExhibitResponse(userId, parsed.data);
        res.status(201).json(response);
      } catch (error) {
        console.error("Error saving exhibit response:", error);
        res.status(500).json({ message: "Failed to save response" });
      }
    },
  );

  app.get(
    "/api/exhibits/:slug/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        const responses = await storage.getExhibitResponses(userId, exhibit.id);
        res.json(responses);
      } catch (error) {
        console.error("Error fetching exhibit responses:", error);
        res.status(500).json({ message: "Failed to fetch responses" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/reflections",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const parsed = insertExhibitReflectionSchema.safeParse({
          ...req.body,
          exhibitId: exhibit.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const reflection = await storage.saveExhibitReflection(
          userId,
          parsed.data,
        );
        res.status(201).json(reflection);
      } catch (error) {
        console.error("Error saving exhibit reflection:", error);
        res.status(500).json({ message: "Failed to save reflection" });
      }
    },
  );

  app.get("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ role: user.role, tier: user.tier });
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ message: "Failed to fetch user role" });
    }
  });

  // === OPPORTUNITY TRACKER ===
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

  // === COMMONS ===
  app.get("/api/commons", async (_req, res) => {
    try {
      const items = await storage.getCommonsWritings();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commons" });
    }
  });

  app.post("/api/commons", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "Missing writingId" });
      const item = await storage.shareToCommons(req.user.id, writingId);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to share to commons" });
    }
  });

  app.delete(
    "/api/commons/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.removeFromCommons(
          req.user.id,
          req.params.writingId,
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove from commons" });
      }
    },
  );

  // === BOUQUETS ===
  app.get("/api/bouquets", async (_req, res) => {
    try {
      const items = await storage.getBouquets();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bouquets" });
    }
  });

  app.get("/api/bouquets/:id", async (req, res) => {
    try {
      const bouquet = await storage.getBouquet(req.params.id);
      if (!bouquet) return res.status(404).json({ message: "Not found" });
      res.json(bouquet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bouquet" });
    }
  });

  app.post("/api/bouquets", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, theme } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });
      const bouquet = await storage.createBouquet(req.user.id, {
        title,
        description,
        theme,
      });
      res.json(bouquet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bouquet" });
    }
  });

  app.post(
    "/api/bouquets/:id/items",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { writingId, note } = req.body;
        if (!writingId)
          return res.status(400).json({ message: "WritingId required" });
        const item = await storage.addBouquetItem(
          req.params.id,
          writingId,
          note,
        );
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to add item" });
      }
    },
  );

  app.delete("/api/bouquets/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBouquet(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bouquet" });
    }
  });

  // === MOODBOARDS ===
  app.get("/api/moodboards", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getMoodboards(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moodboards" });
    }
  });

  app.get("/api/moodboards/shared", async (_req, res) => {
    try {
      const items = await storage.getSharedMoodboards();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared moodboards" });
    }
  });

  app.get("/api/moodboards/:id", async (req, res) => {
    try {
      const board = await storage.getMoodboard(req.params.id);
      if (!board) return res.status(404).json({ message: "Not found" });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moodboard" });
    }
  });

  app.post("/api/moodboards", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });
      const board = await storage.createMoodboard(req.user.id, {
        title,
        description,
      });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to create moodboard" });
    }
  });

  app.patch("/api/moodboards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const board = await storage.updateMoodboard(
        req.user.id,
        req.params.id,
        req.body,
      );
      if (!board) return res.status(404).json({ message: "Not found" });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moodboard" });
    }
  });

  app.post(
    "/api/moodboards/:id/items",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.addMoodboardItem(req.params.id, req.body);
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to add item" });
      }
    },
  );

  app.delete(
    "/api/moodboards/:id/items/:itemId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.deleteMoodboardItem(req.params.itemId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete item" });
      }
    },
  );

  app.delete("/api/moodboards/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMoodboard(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete moodboard" });
    }
  });

  // === SOIL ENTRIES ===
  app.get("/api/soil", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getSoilEntries(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch soil entries" });
    }
  });

  app.post("/api/soil", isAuthenticated, async (req: any, res) => {
    try {
      const { content, entryType, tags } = req.body;
      if (!content)
        return res.status(400).json({ message: "Content required" });
      const entry = await storage.createSoilEntry(req.user.id, {
        content,
        entryType,
        tags,
      });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create soil entry" });
    }
  });

  app.patch("/api/soil/:id", isAuthenticated, async (req: any, res) => {
    try {
      const entry = await storage.updateSoilEntry(
        req.user.id,
        req.params.id,
        req.body,
      );
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update soil entry" });
    }
  });

  app.delete("/api/soil/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteSoilEntry(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete soil entry" });
    }
  });

  // === GALLERY COMMENTS ===
  app.get("/api/gallery-comments/:writingId", async (req, res) => {
    try {
      const { writingId } = req.params;
      const comments = await db
        .select({
          id: galleryComments.id,
          writingId: galleryComments.writingId,
          userId: galleryComments.userId,
          content: galleryComments.content,
          parentId: galleryComments.parentId,
          createdAt: galleryComments.createdAt,
          authorName: users.firstName,
        })
        .from(galleryComments)
        .leftJoin(users, eq(galleryComments.userId, users.id))
        .where(eq(galleryComments.writingId, writingId))
        .orderBy(galleryComments.createdAt);
      res.json(comments);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/gallery-comments", async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const { writingId, content, parentId } = req.body;
      if (!writingId || !content?.trim())
        return res.status(400).json({ error: "Missing required fields" });
      const userId = req.user.claims?.sub || req.user.id;
      const [comment] = await db
        .insert(galleryComments)
        .values({
          writingId,
          userId,
          content: content.trim(),
          parentId: parentId || null,
        })
        .returning();
      res.json(comment);
    } catch (e) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/gallery-comments/:id", async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const comment = await db
        .select()
        .from(galleryComments)
        .where(eq(galleryComments.id, req.params.id))
        .limit(1);
      if (!comment.length)
        return res.status(404).json({ error: "Comment not found" });
      const userId = req.user.claims?.sub || req.user.id;
      if (comment[0].userId !== userId)
        return res.status(403).json({ error: "Not authorized" });
      await db
        .delete(galleryComments)
        .where(eq(galleryComments.id, req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.get(
    "/api/writings/constellations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const userWritings = await storage.getWritingsByAuthor(userId);

        const tagMap = new Map<string, { id: string; title: string }[]>();
        let totalTags = 0;

        for (const w of userWritings) {
          const tags = (w as any).tags || [];
          for (const tag of tags) {
            if (!tag) continue;
            if (!tagMap.has(tag)) {
              tagMap.set(tag, []);
              totalTags++;
            }
            tagMap.get(tag)!.push({ id: w.id, title: w.title });
          }
        }

        const tagFrequencies = Array.from(tagMap.entries())
          .map(([tag, pieces]) => ({ tag, count: pieces.length, pieces }))
          .sort((a, b) => b.count - a.count);

        const pieceTags = new Map<string, string[]>();
        for (const w of userWritings) {
          const tags = ((w as any).tags || []).filter(Boolean);
          if (tags.length > 0) {
            pieceTags.set(w.id, tags);
          }
        }

        const clusterMap = new Map<string, Set<string>>();
        for (const [pieceId, tags] of pieceTags) {
          for (let i = 0; i < tags.length; i++) {
            for (let j = i + 1; j < tags.length; j++) {
              const key = [tags[i], tags[j]].sort().join("||");
              if (!clusterMap.has(key)) clusterMap.set(key, new Set());
              clusterMap.get(key)!.add(pieceId);
            }
          }
        }

        const clusters: {
          tags: string[];
          pieces: { id: string; title: string }[];
          summary: string;
        }[] = [];
        for (const [key, pieceIds] of clusterMap) {
          if (pieceIds.size < 2) continue;
          const tags = key.split("||");
          const pieces = Array.from(pieceIds).map((id) => {
            const w = userWritings.find((w) => w.id === id);
            return { id, title: w?.title || "Untitled" };
          });
          const summary = `These ${tags.length} threads appear together across ${pieces.length} of your pieces — a recurring constellation around [${tags.join(", ")}].`;
          clusters.push({ tags, pieces, summary });
        }

        clusters.sort((a, b) => b.pieces.length - a.pieces.length);

        res.json({
          tagFrequencies,
          clusters: clusters.slice(0, 20),
          totalPieces: userWritings.length,
          totalTags,
        });
      } catch (error) {
        console.error("Error fetching constellations:", error);
        res.status(500).json({ message: "Failed to fetch constellations" });
      }
    },
  );

  app.get("/api/writings/harvest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userWritings = await storage.getWritingsByAuthor(userId);

      const tagFrequency: Record<
        string,
        { count: number; months: Set<string> }
      > = {};
      const monthlyData: Record<
        string,
        { pieceCount: number; wordCount: number; tags: Record<string, number> }
      > = {};
      const tagPairs: Record<string, Set<string>> = {};

      let totalWords = 0;
      let oldestPiece: string | null = null;
      const monthsSet = new Set<string>();

      for (const w of userWritings) {
        const plainText = w.content.replace(/<[^>]*>/g, "");
        const wc = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
        totalWords += wc;

        const created = w.createdAt ? new Date(w.createdAt) : new Date();
        const monthKey = created.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        monthsSet.add(monthKey);

        if (
          !oldestPiece ||
          (w.createdAt && new Date(w.createdAt) < new Date(oldestPiece))
        ) {
          oldestPiece = w.createdAt
            ? new Date(w.createdAt).toISOString()
            : null;
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { pieceCount: 0, wordCount: 0, tags: {} };
        }
        monthlyData[monthKey].pieceCount++;
        monthlyData[monthKey].wordCount += wc;

        const tags = (w.tags || []).filter(Boolean);
        for (const tag of tags) {
          if (!tagFrequency[tag])
            tagFrequency[tag] = { count: 0, months: new Set() };
          tagFrequency[tag].count++;
          tagFrequency[tag].months.add(monthKey);

          if (!monthlyData[monthKey].tags[tag])
            monthlyData[monthKey].tags[tag] = 0;
          monthlyData[monthKey].tags[tag]++;
        }

        for (let i = 0; i < tags.length; i++) {
          for (let j = i + 1; j < tags.length; j++) {
            const pairKey = [tags[i], tags[j]].sort().join("||");
            if (!tagPairs[pairKey]) tagPairs[pairKey] = new Set();
            tagPairs[pairKey].add(w.id);
          }
        }
      }

      const recurringThemes = Object.entries(tagFrequency)
        .filter(([, v]) => v.count >= 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 12)
        .map(([tag, v]) => ({
          tag,
          count: v.count,
          months: Array.from(v.months),
        }));

      const tagClusters = Object.entries(tagPairs)
        .filter(([, pieces]) => pieces.size >= 2)
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 8)
        .map(([pairKey, pieces]) => {
          const tags = pairKey.split("||");
          return {
            tags,
            pieceCount: pieces.size,
            summary: `This cluster of themes appears together across ${pieces.size} of your pieces — a pattern worth noticing.`,
          };
        });

      const revisitedDrafts = userWritings
        .filter(
          (w) =>
            w.updatedAt &&
            w.createdAt &&
            new Date(w.updatedAt).getTime() - new Date(w.createdAt).getTime() >
              60000,
        )
        .map((w) => {
          const snapshots = 1;
          const timeDiff =
            w.updatedAt && w.createdAt
              ? Math.floor(
                  (new Date(w.updatedAt).getTime() -
                    new Date(w.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;
          return {
            id: w.id,
            title: w.title,
            revisitCount: Math.max(1, Math.min(timeDiff, 50)),
            lastUpdated: w.updatedAt
              ? new Date(w.updatedAt).toISOString()
              : new Date().toISOString(),
          };
        })
        .sort((a, b) => b.revisitCount - a.revisitCount)
        .slice(0, 10);

      const monthlyReflection = Object.entries(monthlyData)
        .sort((a, b) => {
          const da = new Date(a[0]);
          const db = new Date(b[0]);
          return db.getTime() - da.getTime();
        })
        .slice(0, 12)
        .map(([month, data]) => ({
          month,
          pieceCount: data.pieceCount,
          wordCount: data.wordCount,
          dominantTags: Object.entries(data.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag),
        }));

      const themeShifts = monthlyReflection.map((m) => ({
        month: m.month,
        tags: m.dominantTags,
      }));

      res.json({
        recurringThemes,
        themeShifts,
        revisitedDrafts,
        tagClusters,
        writingTime: {
          totalPieces: userWritings.length,
          totalWords,
          avgWordsPerPiece:
            userWritings.length > 0
              ? Math.round(totalWords / userWritings.length)
              : 0,
          oldestPiece,
          monthsActive: monthsSet.size,
        },
        monthlyReflection,
      });
    } catch (error) {
      console.error("Error fetching harvest data:", error);
      res.status(500).json({ message: "Failed to fetch harvest data" });
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

    // === PROMPTS MANAGEMENT ===

  app.post("/api/editor/prompts", isEditor, async (req, res) => {
    try {
      const { text, category } = req.body;
      if (!text || typeof text !== "string")
        return res.status(400).json({ message: "Prompt text is required" });
      const [created] = await db
        .insert(promptsTable)
        .values({ text: text.trim(), category: category || "freewrite" })
        .returning();
      res.json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.put("/api/editor/prompts/:id", isEditor, async (req, res) => {
    try {
      const { text, category } = req.body;
      if (!text || typeof text !== "string")
        return res.status(400).json({ message: "Prompt text is required" });
      const [updated] = await db
        .update(promptsTable)
        .set({ text: text.trim(), category: category || "freewrite" })
        .where(eq(promptsTable.id, req.params.id))
        .returning();
      if (!updated)
        return res.status(404).json({ message: "Prompt not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete("/api/editor/prompts/:id", isEditor, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(promptsTable)
        .where(eq(promptsTable.id, req.params.id))
        .returning();
      if (!deleted)
        return res.status(404).json({ message: "Prompt not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  // === SITE CONTENT CMS ===

  app.get("/api/site-content", isEditor, async (_req, res) => {
    try {
      const all = await storage.getAllSiteContent();
      res.json(all);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.get("/api/site-content/:pageKey", async (req, res) => {
    try {
      const rows = await storage.getSiteContentByPage(req.params.pageKey);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.put("/api/site-content/:id", isEditor, async (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== "string")
        return res.status(400).json({ message: "Content is required" });
      const userId =
        req.user?.claims?.sub || (req.session as any)?.user?.claims?.sub;
      const updated = await storage.updateSiteContent(
        req.params.id,
        content,
        userId,
      );
      if (!updated)
        return res.status(404).json({ message: "Content not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update site content" });
    }
  });

  app.post("/api/site-content", isEditor, async (req, res) => {
    try {
      const parsed = insertSiteContentSchema.parse(req.body);
      const created = await storage.createSiteContent(parsed);
      res.json(created);
    } catch (err: any) {
      if (err?.code === "23505")
        return res
          .status(409)
          .json({ message: "Content for this page/section already exists" });
      res.status(400).json({ message: err?.message || "Invalid data" });
    }
  });

  app.delete("/api/site-content/:id", isEditorInChief, async (req, res) => {
    try {
      const deleted = await storage.deleteSiteContent(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "Content not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete site content" });
    }
  });

  app.get("/api/admin/user-count", async (_req, res) => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      res.json({ count: Number(result[0].count) });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user count" });
    }
  });

  app.get("/api/admin/user-list", async (_req, res) => {
    try {
      const result = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user list" });
    }
  });

  app.get("/api/admin/user-activity", async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.tier,
          u.created_at,
          COALESCE(w.writing_count, 0) AS writing_count,
          COALESCE(w.published_count, 0) AS published_count,
          w.stages_used,
          w.genres_used,
          COALESCE(iw.inner_weather_count, 0) AS inner_weather_count,
          COALESCE(ce.compost_count, 0) AS compost_count,
          COALESCE(tt.topic_count, 0) AS topic_count,
          COALESCE(gh.greenhouse_count, 0) AS greenhouse_count,
          (
            COALESCE(w.writing_count, 0) +
            COALESCE(iw.inner_weather_count, 0) +
            COALESCE(ce.compost_count, 0) +
            COALESCE(tt.topic_count, 0) +
            COALESCE(gh.greenhouse_count, 0)
          ) AS total_actions
        FROM users u
        LEFT JOIN (
          SELECT author_id,
            COUNT(*) AS writing_count,
            COUNT(*) FILTER (WHERE is_published) AS published_count,
            array_agg(DISTINCT stage) FILTER (WHERE stage IS NOT NULL) AS stages_used,
            array_agg(DISTINCT genre) FILTER (WHERE genre IS NOT NULL) AS genres_used
          FROM writings GROUP BY author_id
        ) w ON w.author_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS inner_weather_count
          FROM inner_weather GROUP BY user_id
        ) iw ON iw.user_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS compost_count
          FROM compost_entries GROUP BY user_id
        ) ce ON ce.user_id = u.id
        LEFT JOIN (
          SELECT author_id, COUNT(*) AS topic_count
          FROM table_topics GROUP BY author_id
        ) tt ON tt.author_id = u.id
        LEFT JOIN (
          SELECT editor_id, COUNT(*) AS greenhouse_count
          FROM greenhouse_entries GROUP BY editor_id
        ) gh ON gh.editor_id = u.id
        ORDER BY total_actions DESC, u.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // ── Appreciations ──
  app.post(
    "/api/appreciations/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db
          .select()
          .from(appreciations)
          .where(
            and(
              eq(appreciations.userId, userId),
              eq(appreciations.writingId, writingId),
            ),
          )
          .limit(1);
        if (existing.length > 0) {
          await db
            .delete(appreciations)
            .where(
              and(
                eq(appreciations.userId, userId),
                eq(appreciations.writingId, writingId),
              ),
            );
          return res.json({ appreciated: false });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations
        WHERE user_id = ${userId} AND created_at >= ${today}
      `);
        if (Number(todayCount.rows[0]?.total || 0) >= 5) {
          return res
            .status(429)
            .json({
              message:
                "You've shared 5 admires today — save the rest for tomorrow",
              capped: true,
            });
        }
        await db.insert(appreciations).values({ userId, writingId });
        res.json({ appreciated: true });
      } catch (err) {
        res.status(500).json({ message: "Failed to toggle appreciation" });
      }
    },
  );

  app.get(
    "/api/appreciations/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const [countResult] = await db
          .select({ value: count() })
          .from(appreciations)
          .where(eq(appreciations.writingId, writingId));
        const mine = await db
          .select()
          .from(appreciations)
          .where(
            and(
              eq(appreciations.userId, userId),
              eq(appreciations.writingId, writingId),
            ),
          )
          .limit(1);
        res.json({
          count: countResult?.value || 0,
          appreciated: mine.length > 0,
        });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch appreciation" });
      }
    },
  );

  app.get(
    "/api/appreciations/my-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations a
        JOIN writings w ON a.writing_id = w.id
        WHERE w.author_id = ${userId}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch appreciation count" });
      }
    },
  );

  // ── Letters to the Work ──
  app.get("/api/letters/:writingId", isAuthenticated, async (req: any, res) => {
    try {
      const writingId = req.params.writingId;
      const result = await db.execute(sql`
        SELECT l.id, l.content, l.created_at as "createdAt",
               u.display_name as "authorName", u.id as "authorId"
        FROM letters l
        JOIN users u ON l.user_id = u.id
        WHERE l.writing_id = ${writingId}
        ORDER BY l.created_at ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch letters" });
    }
  });

  app.post(
    "/api/letters/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const parsed = insertLetterSchema.safeParse({
          writingId,
          content: req.body?.content,
        });
        if (!parsed.success) {
          return res.status(400).json({ message: "Letter cannot be empty" });
        }
        const [letter] = await db
          .insert(letters)
          .values({ userId, writingId, content: parsed.data.content.trim() })
          .returning();
        res.json(letter);
      } catch (err) {
        res.status(500).json({ message: "Failed to send letter" });
      }
    },
  );

  // ── Bookshelf (uses savedPieces) ──
  app.get("/api/bookshelf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await db.execute(sql`
        SELECT sp.id, sp.writing_id as "writingId", sp.saved_at as "savedAt",
               w.title, w.content, w.genre, w.author_id as "authorId",
               u.display_name as "authorName"
        FROM saved_pieces sp
        JOIN writings w ON sp.writing_id = w.id
        JOIN users u ON w.author_id = u.id
        WHERE sp.user_id = ${userId}
        ORDER BY sp.saved_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bookshelf" });
    }
  });

  app.post(
    "/api/bookshelf/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db.execute(sql`
        SELECT id FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId} LIMIT 1
      `);
        if (existing.rows.length > 0) {
          await db.execute(
            sql`DELETE FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId}`,
          );
          return res.json({ kept: false });
        }
        await db.execute(
          sql`INSERT INTO saved_pieces (id, user_id, writing_id) VALUES (gen_random_uuid(), ${userId}, ${writingId})`,
        );
        res.json({ kept: true });
      } catch (err) {
        res.status(500).json({ message: "Failed to toggle bookshelf" });
      }
    },
  );

  app.get(
    "/api/bookshelf/check/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db.execute(sql`
        SELECT id FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId} LIMIT 1
      `);
        res.json({ kept: existing.rows.length > 0 });
      } catch (err) {
        res.status(500).json({ message: "Failed to check bookshelf" });
      }
    },
  );

  // ── Admire (5/day cap + admirers list) ──
  app.get(
    "/api/admires/today-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations
        WHERE user_id = ${userId} AND created_at >= ${today}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to fetch today's admire count" });
      }
    },
  );

  app.get(
    "/api/writings/:id/admirers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT u.first_name as name, a.created_at as "createdAt"
        FROM appreciations a
        JOIN users u ON a.user_id = u.id
        WHERE a.writing_id = ${req.params.id}
        ORDER BY a.created_at DESC
      `);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch admirers" });
      }
    },
  );

  // ── Tended (monthly count for author) ──
  app.get(
    "/api/writings/:id/tended-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM resonances
        WHERE writing_id = ${req.params.id} AND type = 'tended'
        AND created_at >= ${monthStart}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch tended count" });
      }
    },
  );

  // ── Echo ──
  app.post("/api/echoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId, echoedLine } = req.body;
      if (!writingId || !echoedLine)
        return res
          .status(400)
          .json({ message: "writingId and echoedLine required" });
      const writing = await storage.getWriting(writingId);
      if (!writing)
        return res.status(404).json({ message: "Writing not found" });
      if (writing.authorId === userId)
        return res.status(400).json({ message: "Cannot echo your own work" });
      const newWriting = await storage.createWriting(userId, {
        title: "Echoed Fragment",
        content: `<blockquote><em>${echoedLine}</em></blockquote>`,
        genre: writing.genre || "fragment",
        visibility: "personal",
        readiness: "raw_seed",
        tags: ["echo"],
      });
      const [echo] = await db
        .insert(echoes)
        .values({
          userId,
          writingId,
          echoedLine,
          createdWritingId: newWriting.id,
        })
        .returning();
      res.status(201).json(echo);
    } catch (err) {
      res.status(500).json({ message: "Failed to create echo" });
    }
  });

  app.get(
    "/api/writings/:id/echo-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM echoes WHERE writing_id = ${req.params.id}
      `);
        const lineResults = await db.execute(sql`
        SELECT echoed_line as "echoedLine", COUNT(*) as count
        FROM echoes WHERE writing_id = ${req.params.id}
        GROUP BY echoed_line ORDER BY count DESC LIMIT 5
      `);
        res.json({
          totalEchoes: Number(result.rows[0]?.total || 0),
          lines: lineResults.rows.map((r: any) => ({
            line: r.echoedLine,
            count: Number(r.count),
          })),
        });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch echo count" });
      }
    },
  );

  // ── Gentle Reactions (author-only view) ──
  app.get(
    "/api/writings/:id/gentle-reactions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT type, COUNT(*) as count FROM resonances
        WHERE writing_id = ${req.params.id} AND type IN ('spark', 'fog', 'seedling')
        GROUP BY type
      `);
        const reactions: Record<string, number> = {};
        for (const row of result.rows as any[]) {
          reactions[row.type] = Number(row.count);
        }
        res.json(reactions);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch gentle reactions" });
      }
    },
  );

  // ── Whisper ("What stayed with you?") ──
  app.post(
    "/api/whispers/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const { content } = req.body;
        if (!content || content.length > 280)
          return res
            .status(400)
            .json({ message: "Content required (max 280 chars)" });
        const writing = await storage.getWriting(writingId);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId === userId)
          return res
            .status(400)
            .json({ message: "Cannot whisper to your own work" });
        const [whisper] = await db
          .insert(whispers)
          .values({
            fromUserId: userId,
            writingId,
            content,
          })
          .returning();
        await storage.createNotification(writing.authorId, {
          type: "whisper",
          actorId: userId,
          writingId,
          message: `whispered about "${writing.title || "Untitled"}"`,
        });
        res.status(201).json(whisper);
      } catch (err) {
        res.status(500).json({ message: "Failed to send whisper" });
      }
    },
  );

  app.get(
    "/api/writings/:id/whisper-messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT w.content, w.created_at as "createdAt", u.first_name as "fromName"
        FROM whispers w
        JOIN users u ON w.from_user_id = u.id
        WHERE w.writing_id = ${req.params.id}
        ORDER BY w.created_at DESC
      `);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch whispers" });
      }
    },
  );

  // ── Save to Re-Read count (author only) ──
  app.get(
    "/api/writings/:id/save-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM saved_pieces WHERE writing_id = ${req.params.id}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch save count" });
      }
    },
  );

  app.post("/api/contact-messages", async (req: any, res) => {
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Please fill in all fields correctly" });
      }
      const msg = await storage.createContactMessage(parsed.data);
      res.json({ id: msg.id });
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/conversations", async (req: any, res) => {
    try {
      const { userName, userEmail, subject, message } = req.body;
      if (
        !userName?.trim() ||
        !userEmail?.trim() ||
        !subject?.trim() ||
        !message?.trim()
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const conv = await storage.createConversation({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        subject: subject.trim(),
        status: "open",
      });
      await storage.addChatMessage({
        conversationId: conv.id,
        senderName: userName.trim(),
        senderEmail: userEmail.trim(),
        senderRole: "user",
        message: message.trim(),
      });
      res.json(conv);
    } catch (err) {
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const convs = await storage.getConversations();
      res.json(convs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: any, res) => {
    try {
      const conv = await storage.getConversation(req.params.id);
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      res.json(conv);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch(
    "/api/conversations/:id/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { status } = req.body;
        if (!["open", "closed"].includes(status))
          return res.status(400).json({ message: "Invalid status" });
        const conv = await storage.updateConversationStatus(
          req.params.id,
          status,
        );
        if (!conv)
          return res.status(404).json({ message: "Conversation not found" });
        res.json(conv);
      } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
      }
    },
  );

  app.get("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const msgs = await storage.getChatMessages(req.params.id);
      res.json(msgs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const conv = await storage.getConversation(req.params.id);
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      if (conv.status === "closed")
        return res.status(400).json({ message: "This conversation is closed" });
      const { senderName, senderEmail, senderRole, message } = req.body;
      if (!senderName?.trim() || !message?.trim())
        return res
          .status(400)
          .json({ message: "Name and message are required" });

      let resolvedRole = "user";
      if (senderRole === "editor") {
        if (!req.user?.claims?.sub)
          return res
            .status(401)
            .json({ message: "Authentication required to send as editor" });
        const editorUser = await storage.getUser(req.user.id);
        if (
          !editorUser ||
          !["editor", "editor_in_chief"].includes(editorUser.role || "")
        ) {
          return res.status(403).json({ message: "Editor role required" });
        }
        resolvedRole = "editor";
      }

      const msg = await storage.addChatMessage({
        conversationId: req.params.id,
        senderName: senderName.trim(),
        senderEmail: (senderEmail || "").trim(),
        senderRole: resolvedRole,
        message: message.trim(),
      });
      res.json(msg);
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // === EDITOR BIO MANAGEMENT ===
  app.get("/api/admin/users", isAuthenticated, isEditorInChief, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId/bio", isAuthenticated, isEditorInChief, async (req: any, res) => {
    try {
      const { bio } = req.body;
      const user = await storage.updateUserBio(req.params.userId, bio);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

    // === EIC DASHBOARD STATS ===
  app.get("/api/eic/dashboard-stats", isEditorInChief, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allWritings = await storage.getAllWritingsForEIC();
      const gardenPresenceData = await storage.getActiveGardenPresence();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalUsers = allUsers.length;
      const newUsersThisMonth = allUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) > thirtyDaysAgo).length;
      const newUsersThisWeek = allUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) > sevenDaysAgo).length;
      const activeInGarden = gardenPresenceData.length;

      const totalWritings = allWritings.length;
      const seeds = allWritings.filter((w: any) => w.readiness === "raw_seed").length;
      const growing = allWritings.filter((w: any) => w.readiness === "growing").length;
      const readyToShow = allWritings.filter((w: any) => w.readiness === "ready_to_show").length;
      const published = allWritings.filter((w: any) => w.isPublished).length;
      const editorialAvailable = allWritings.filter((w: any) => w.editorialAvailable).length;
      const writingsThisWeek = allWritings.filter((w: any) => w.createdAt && new Date(w.createdAt) > sevenDaysAgo).length;
      const writingsThisMonth = allWritings.filter((w: any) => w.createdAt && new Date(w.createdAt) > thirtyDaysAgo).length;

      res.json({
        users: { total: totalUsers, newThisMonth: newUsersThisMonth, newThisWeek: newUsersThisWeek, activeInGarden },
        writings: { total: totalWritings, seeds, growing, readyToShow, published, editorialAvailable, thisWeek: writingsThisWeek, thisMonth: writingsThisMonth },
      });
    } catch (error) {
      console.error("Error fetching EIC dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/eic/all-writings", isEditorInChief, async (req: any, res) => {
    try {
      const writings = await storage.getAllWritingsForEIC();
      res.json(writings);
    } catch (error) {
      console.error("Error fetching all writings for EIC:", error);
      res.status(500).json({ message: "Failed to fetch writings" });
    }
  });

  app.get("/api/eic/all-users", isEditorInChief, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users for EIC:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

    // === EDITORIAL SERVICES WAITLIST ===
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

  // PayPal create order
  app.post("/api/paypal/create-order", async (req: any, res) => {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: "Payment service is not configured. Please try again later." });
    }
    try {
      const { waitlistId, writingId, tier, amount } = req.body; const TIER_PRICES: Record<string, number> = { priority: 5, feedback: 7, bundle: 10 }; if (writingId && tier) { if (!TIER_PRICES[tier] || Number(amount) !== TIER_PRICES[tier]) { return res.status(400).json({ message: "Invalid tier or amount" }); } const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64"); const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ amount: { currency_code: "GBP", value: String(amount) }, description: `Page Gallery Editorial: ${tier}` }], }), }); const order = await response.json(); const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href; return res.json({ ...order, approvalUrl }); }
      const [entry] = await db.select().from(editorialWaitlist).where(eq(editorialWaitlist.id, waitlistId));
      if (!entry || entry.status !== "invited") {
        return res.status(403).json({ message: "Not eligible for payment" });
      }
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ amount: { currency_code: "GBP", value: String(amount) }, description: "Page Gallery Editorial Services" }],
        }),
      });
      const order = await response.json();
      res.json(order);
    } catch (error) {
      console.error("PayPal create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // PayPal capture order
  app.post("/api/paypal/capture-order", async (req: any, res) => {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: "Payment service is not configured. Please try again later." });
    }
    try {
      const { orderId, waitlistId, writingId, tier, userId } = req.body;
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      });
      const capture = await response.json();
      if (capture.status === "COMPLETED" && waitlistId) {
        await db.update(editorialWaitlist)
          .set({ paymentConfirmed: true, paypalOrderId: orderId, status: "paid", updatedAt: new Date() })
          .where(eq(editorialWaitlist.id, waitlistId));
      }
      res.json(capture);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ message: "Failed to capture payment" });
    }
  });

    // Get editorial waitlist entry by payment token
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


    // === EIC STUDIO: CIRCLES OVERSIGHT FOR SOPHIA ===
  // EIC can see all circles, their members, activity, and shared pieces
  app.get("/api/eic/circles-overview", isEditorInChief, async (req: any, res) => {
    try {
      const allCircles = await db.select({
        id: circles.id,
        name: circles.name,
        description: circles.description,
        createdById: circles.createdById,
        createdAt: circles.createdAt,
      }).from(circles).orderBy(desc(circles.createdAt));

      const circlesWithDetails = await Promise.all(allCircles.map(async (circle) => {
        const members = await db.select({
          userId: circleMembers.userId,
           
          joinedAt: circleMembers.joinedAt,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userEmail: users.email,
        }).from(circleMembers)
          .leftJoin(users, eq(circleMembers.userId, users.id))
          .where(eq(circleMembers.circleId, circle.id));

const sharedPieces = await db.select({
              shareId: circleShares.id,
              writingId: circleShares.writingId,
              userId: circleShares.userId,
              weekOf: circleShares.weekOf,
               
            }).from(circleShares)
              .where(eq(circleShares.circleId, circle.id))
              .orderBy(desc(circleShares.id));

        const creator = await db.select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }).from(users).where(eq(users.id, circle.createdById)).limit(1);

        return {
          ...circle,
          creator: creator[0] || null,
          memberCount: members.length,
          members,
          sharedPieceCount: sharedPieces.length,
          sharedPieces,
        };
      }));

      res.json(circlesWithDetails);
    } catch (error) {
      console.error("Error fetching circles overview:", error);
      res.status(500).json({ message: "Failed to fetch circles overview" });
    }
  });

  // EIC Studio: Full platform usage dashboard - everything Sophia needs in one call
  app.get("/api/eic/full-usage-dashboard", isEditorInChief, async (req: any, res) => {
    try {
      // Total counts
      const [userCount] = await db.select({ count: sql`count(*)::int` }).from(users);
      const [writingCount] = await db.select({ count: sql`count(*)::int` }).from(writings);
      const [publishedCount] = await db.select({ count: sql`count(*)::int` }).from(writings).where(eq(writings.isPublished, true));
      const [rawSeedCount] = await db.select({ count: sql`count(*)::int` }).from(writings).where(eq(writings.readiness, "raw_seed"));
      const [growingCount] = await db.select({ count: sql`count(*)::int` }).from(writings).where(eq(writings.readiness, "growing"));
      const [editorialCount] = await db.select({ count: sql`count(*)::int` }).from(writings).where(eq(writings.editorialAvailable, true));
      const [ritualCount] = await db.select({ count: sql`count(*)::int` }).from(ritualSessions);
      const [weatherCount] = await db.select({ count: sql`count(*)::int` }).from(innerWeather);
      const [reflectionCount] = await db.select({ count: sql`count(*)::int` }).from(reflections);
      const [journalCount] = await db.select({ count: sql`count(*)::int` }).from(growthJournalEntries);
      const [pollinationCount] = await db.select({ count: sql`count(*)::int` }).from(pollinations);
      const [savedCount] = await db.select({ count: sql`count(*)::int` }).from(savedPieces);
      const [resonanceCount] = await db.select({ count: sql`count(*)::int` }).from(resonances);
      const [circleCount] = await db.select({ count: sql`count(*)::int` }).from(circles);
      const [circleMemberCount] = await db.select({ count: sql`count(*)::int` }).from(circleMembers);

      // Time-based metrics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [writingsThisWeek] = await db.select({ count: sql`count(*)::int` }).from(writings).where(sql`${writings.createdAt} > ${sevenDaysAgo}`);
      const [writingsThisMonth] = await db.select({ count: sql`count(*)::int` }).from(writings).where(sql`${writings.createdAt} > ${thirtyDaysAgo}`);
      const [usersThisWeek] = await db.select({ count: sql`count(*)::int` }).from(users).where(sql`${users.createdAt} > ${sevenDaysAgo}`);
      const [usersThisMonth] = await db.select({ count: sql`count(*)::int` }).from(users).where(sql`${users.createdAt} > ${thirtyDaysAgo}`);
      const [ritualsThisWeek] = await db.select({ count: sql`count(*)::int` }).from(ritualSessions).where(sql`${ritualSessions.completedAt} > ${sevenDaysAgo}`);

      // Most active users (by writing count in last 30 days)
      const activeUsers = await db.select({
        userId: writings.authorId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        writingCount: sql`count(*)::int`,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(sql`${writings.createdAt} > ${thirtyDaysAgo}`)
        .groupBy(writings.authorId, users.firstName, users.lastName, users.email)
        .orderBy(sql`count(*) DESC`)
        .limit(20);

      // Recent writings (last 20 across all users)
      const recentWritings = await db.select({
        id: writings.id,
        title: writings.title,
        readiness: writings.readiness,
        isPublished: writings.isPublished,
        editorialAvailable: writings.editorialAvailable,
        createdAt: writings.createdAt,
        updatedAt: writings.updatedAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      }).from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .orderBy(desc(writings.updatedAt))
        .limit(20);

      // Active garden presence
      const activePresence = await storage.getActiveWriterCount();

      res.json({
        totals: {
          users: userCount?.count || 0,
          writings: writingCount?.count || 0,
          published: publishedCount?.count || 0,
          rawSeeds: rawSeedCount?.count || 0,
          growing: growingCount?.count || 0,
          editorialAvailable: editorialCount?.count || 0,
          rituals: ritualCount?.count || 0,
          innerWeather: weatherCount?.count || 0,
          reflections: reflectionCount?.count || 0,
          journalEntries: journalCount?.count || 0,
          pollinations: pollinationCount?.count || 0,
          savedPieces: savedCount?.count || 0,
          resonances: resonanceCount?.count || 0,
          circles: circleCount?.count || 0,
          circleMembers: circleMemberCount?.count || 0,
        },
        thisWeek: {
          newWritings: writingsThisWeek?.count || 0,
          newUsers: usersThisWeek?.count || 0,
          rituals: ritualsThisWeek?.count || 0,
        },
        thisMonth: {
          newWritings: writingsThisMonth?.count || 0,
          newUsers: usersThisMonth?.count || 0,
        },
        activePresence,
        mostActiveUsers: activeUsers,
        recentWritings,
      });
    } catch (error) {
      console.error("Error fetching full usage dashboard:", error);
      res.status(500).json({ message: "Failed to fetch usage dashboard" });
    }
  });

    // === CIRCLE BOARD POSTS ===
  app.get("/api/circles/:circleId/board-posts", isAuthenticated, async (req, res) => {
    try {
      const { circleId } = req.params;
      const posts = await db
        .select()
        .from(boardPosts)
        .where(eq(boardPosts.circleId, String(circleId)))
        .orderBy(desc(boardPosts.createdAt));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching board posts:", error);
      res.status(500).json({ message: "Failed to fetch board posts" });
    }
  });

  app.post("/api/circles/:circleId/board-posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { circleId } = req.params;
      const validated = insertBoardPostSchema.parse({ ...req.body, circleId });
      const [post] = await db.insert(boardPosts).values({ ...validated, userId }).returning();
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating board post:", error);
      res.status(500).json({ message: "Failed to create board post" });
    }
  });

  // === PUBLIC PIECE (Open Graph / SEO) ===
  app.get("/api/public-piece/:id", async (req, res) => {
    try {
      const writing = await storage.getWriting(req.params.id);
      if (!writing || !writing.isPublished)
        return res.status(404).json({ message: "Not found" });
      const author = await storage.getUser(writing.authorId);
      const plainText = (writing.content || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const description = plainText.slice(0, 160);
      res.json({
        id: writing.id,
        title: writing.title,
        content: writing.content,
        genre: writing.genre,
        tags: writing.tags,
        createdAt: writing.createdAt,
        description,
        author: author
          ? {
              id: author.id,
              displayName: author.displayName || author.firstName || "Anonymous",
              bio: author.bio,
              profileImageUrl: author.profileImageUrl,
            }
          : null,
      });
    } catch (error) {
      console.error("Error fetching public piece:", error);
      res.status(500).json({ message: "Failed to fetch piece" });
    }
  });

  // Public writer profile (SEO)
  app.get("/api/public-writer/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "Writer not found" });
      const writings = await storage.getPublishedWritings(req.params.userId).catch(() => []);
      res.json({
        id: user.id,
        displayName: user.displayName || user.firstName || "Anonymous",
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        publishedCount: writings.length,
        recentPieces: writings.slice(0, 6).map((w: any) => ({
          id: w.id,
          title: w.title,
          genre: w.genre,
          createdAt: w.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching public writer:", error);
      res.status(500).json({ message: "Failed to fetch writer" });
    }
  });

    // ============================================================
  // THE GROVE — Botanical Social Layer
  // ============================================================

  // GET /api/grove/my-plant — fetch or initialise the current user's plant
  app.get("/api/grove/my-plant", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { rows } = await (await import("./db")).pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1`,
        [userId]
      );
      if (rows.length === 0) {
        // Auto-create plant on first visit
        const { rows: newRows } = await (await import("./db")).pool.query(
          `INSERT INTO grove_plants (user_id) VALUES ($1) RETURNING *`,
          [userId]
        );
        return res.json(newRows[0]);
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error fetching grove plant:", error);
      res.status(500).json({ message: "Failed to fetch grove plant" });
    }
  });

  // POST /api/grove/water — daily watering (private streak)
  app.post("/api/grove/water", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("./db");
      // Check if already watered today
      const today = new Date().toISOString().slice(0, 10);
      const { rows: existing } = await db.pool.query(
        `SELECT id FROM grove_watering_sessions WHERE user_id = $1 AND watered_on = $2`,
        [userId, today]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: "Already watered today" });
      }
      // Log watering session
      await db.pool.query(
        `INSERT INTO grove_watering_sessions (user_id, watered_on) VALUES ($1, $2)`,
        [userId, today]
      );
      // Update streak on plant
      const { rows: plant } = await db.pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1`,
        [userId]
      );
      let currentPlant = plant[0];
      if (!currentPlant) {
        const { rows: newPlant } = await db.pool.query(
          `INSERT INTO grove_plants (user_id) VALUES ($1) RETURNING *`,
          [userId]
        );
        currentPlant = newPlant[0];
      }
      const lastWatered = currentPlant.last_watered_at
        ? new Date(currentPlant.last_watered_at).toISOString().slice(0, 10)
        : null;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak =
        lastWatered === yesterday ? (currentPlant.streak_days || 0) + 1 : 1;
      const { rows: updated } = await db.pool.query(
        `UPDATE grove_plants SET streak_days = $1, last_watered_at = NOW(), updated_at = NOW() WHERE user_id = $2 RETURNING *`,
        [newStreak, userId]
      );
      res.json({ plant: updated[0], streakDays: newStreak });
    } catch (error) {
      console.error("Error watering plant:", error);
      res.status(500).json({ message: "Failed to water plant" });
    }
  });

  // GET /api/grove/connections — list mutual tending connections
  app.get("/api/grove/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `SELECT gc.*, u.display_name, u.profile_image_url
         FROM grove_connections gc
         JOIN users u ON (
           CASE WHEN gc.requester_id = $1 THEN u.id = gc.addressee_id
                ELSE u.id = gc.requester_id END
         )
         WHERE (gc.requester_id = $1 OR gc.addressee_id = $1)
           AND gc.status = 'accepted'`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching grove connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // POST /api/grove/connections/request — send a tending request
  app.post("/api/grove/connections/request", isAuthenticated, async (req, res) => {
    try {
      const requesterId = (req.user as any).claims.sub;
      const { addresseeId } = req.body;
      if (!addresseeId) return res.status(400).json({ message: "addresseeId required" });
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `INSERT INTO grove_connections (requester_id, addressee_id)
         VALUES ($1, $2)
         ON CONFLICT (requester_id, addressee_id) DO NOTHING
         RETURNING *`,
        [requesterId, addresseeId]
      );
      res.json(rows[0] || { message: "Request already sent" });
    } catch (error) {
      console.error("Error sending grove connection request:", error);
      res.status(500).json({ message: "Failed to send request" });
    }
  });

  // POST /api/grove/connections/:id/accept — accept a tending request
  app.post("/api/grove/connections/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { id } = req.params;
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `UPDATE grove_connections SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 AND addressee_id = $2
         RETURNING *`,
        [id, userId]
      );
      if (!rows[0]) return res.status(404).json({ message: "Request not found" });
      res.json(rows[0]);
    } catch (error) {
      console.error("Error accepting grove connection:", error);
      res.status(500).json({ message: "Failed to accept request" });
    }
  });

  // GET /api/grove/seed-packets — list my referral seed packets
  app.get("/api/grove/seed-packets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `SELECT * FROM grove_seed_packets WHERE sender_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching seed packets:", error);
      res.status(500).json({ message: "Failed to fetch seed packets" });
    }
  });

  // POST /api/grove/seed-packets — create a new referral seed packet
  app.post("/api/grove/seed-packets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("./db");
      // Limit: max 10 pending packets per user
      const { rows: existing } = await db.pool.query(
        `SELECT id FROM grove_seed_packets WHERE sender_id = $1 AND status = 'pending'`,
        [userId]
      );
      if (existing.length >= 10) {
        return res.status(429).json({ message: "Seed packet limit reached" });
      }
      const token = randomUUID();
      const { rows } = await db.pool.query(
        `INSERT INTO grove_seed_packets (sender_id, token) VALUES ($1, $2) RETURNING *`,
        [userId, token]
      );
      res.json({ ...rows[0], inviteUrl: `/grove/join?seed=${token}` });
    } catch (error) {
      console.error("Error creating seed packet:", error);
      res.status(500).json({ message: "Failed to create seed packet" });
    }
  });

  // GET /api/grove/seed-packets/redeem/:token — redeem a referral (public)
  app.get("/api/grove/seed-packets/redeem/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `SELECT gsp.*, u.display_name as sender_name
         FROM grove_seed_packets gsp
         JOIN users u ON u.id = gsp.sender_id
         WHERE gsp.token = $1 AND gsp.status = 'pending'`,
        [token]
      );
      if (!rows[0]) return res.status(404).json({ message: "Seed packet not found or already used" });
      res.json({
        token,
        senderName: rows[0].sender_name,
        rarePlantUnlock: rows[0].rare_plant_unlock,
        message: "Sign up to plant your rare seed and join the Grove!",
      });
    } catch (error) {
      console.error("Error redeeming seed packet:", error);
      res.status(500).json({ message: "Failed to redeem seed packet" });
    }
  });

  // POST /api/grove/seed-packets/redeem — mark a seed packet used after signup
  app.post("/api/grove/seed-packets/redeem", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token required" });
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `UPDATE grove_seed_packets
         SET status = 'redeemed', redeemed_by_id = $1, redeemed_at = NOW()
         WHERE token = $2 AND status = 'pending'
         RETURNING *`,
        [userId, token]
      );
      if (!rows[0]) return res.status(404).json({ message: "Token invalid or already redeemed" });
      // Unlock rare plant on the new user's plant
      await db.pool.query(
        `INSERT INTO grove_plants (user_id, rare_plant_unlocked)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET rare_plant_unlocked = $2`,
        [userId, rows[0].rare_plant_unlock]
      );
      res.json({ message: "Rare seed planted! Welcome to the Grove.", rarePlantUnlock: rows[0].rare_plant_unlock });
    } catch (error) {
      console.error("Error redeeming seed packet:", error);
      res.status(500).json({ message: "Failed to redeem seed packet" });
    }
  });

  // GET /api/grove/plants - get current user's grove plants
  app.get("/api/grove/plants", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching grove plants:", error);
      res.status(500).json({ message: "Failed to fetch grove plants" });
    }
  });

  // GET /api/grove/community - get all public grove plants
  app.get("/api/grove/community", async (req, res) => {
    try {
      const db = await import("./db");
      const { rows } = await db.pool.query(
        `SELECT gp.*, u.display_name as author_name FROM grove_plants gp LEFT JOIN users u ON gp.user_id = u.id ORDER BY gp.created_at DESC LIMIT 50`
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching community plants:", error);
      res.status(500).json({ message: "Failed to fetch community plants" });
    }
  });

  // === NEWSLETTER ===
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email required" });
      }
      const db = await import("./db");
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

    // ─── HEALTH CHECK (keep-warm ping endpoint) ───────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── PUBLIC GARDEN ENTRIES (public writings shared to the garden) ────────
  app.get("/api/garden/entries", async (_req, res) => {
    try {
      const { db } = await import("./db");
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

  // ── STUDIO PRODUCTS ──────────────────────────────────────────────────────
  // GET /api/studio/products — list all published studio products
  app.get("/api/studio/products", async (_req, res) => {
    try {
      const { db } = await import("./db");
      // Use exhibits table as studio products (slug, title, subtitle, price, isPublished)
      const { exhibits } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
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

  // GET /api/studio/products/:slug — single product detail
  app.get("/api/studio/products/:slug", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { exhibits } = await import("../shared/schema");
      const { eq, and } = await import("drizzle-orm");
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
  // ─────────────────────────────────────────────────────────────────────────────

  // === CHAPBOOK COLLECTIONS / BEDS ===
  // POST /api/collections - create a new collection
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

  // GET /api/collections - get my collections
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

  // GET /api/collections/:id - get a single collection with items
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

  // PATCH /api/collections/:id - update collection
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

  // DELETE /api/collections/:id - delete a collection
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

  // POST /api/collections/:id/items - add a writing to collection
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

  // DELETE /api/collections/:id/items/:itemId - remove item from collection
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

  // POST /api/collections/:id/unlock - record an unlock (tip payment confirmed externally)
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

  // GET /api/collections/:id/share - get shareable public link
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

  
  // ========================================
    // === EDITOR DIRECT MESSAGES ===
  // GET /api/editor/direct-messages/conversations — list editors I've messaged or who messaged me
  app.get("/api/editor/direct-messages/conversations", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        SELECT DISTINCT ON (other_id)
          other_id,
          other_name,
          other_email,
          last_message,
          last_at,
          unread_count
        FROM (
          SELECT
            CASE WHEN from_editor_id = $1 THEN to_editor_id ELSE from_editor_id END AS other_id,
            CASE WHEN from_editor_id = $1 THEN u2.first_name ELSE u1.first_name END AS other_name,
            CASE WHEN from_editor_id = $1 THEN u2.email ELSE u1.email END AS other_email,
            edm.content AS last_message,
            edm.created_at AS last_at,
            SUM(CASE WHEN edm.to_editor_id = $1 AND edm.is_read = false THEN 1 ELSE 0 END)
              OVER (PARTITION BY CASE WHEN from_editor_id = $1 THEN to_editor_id ELSE from_editor_id END) AS unread_count
          FROM editor_direct_messages edm
          JOIN users u1 ON u1.id = edm.from_editor_id
          JOIN users u2 ON u2.id = edm.to_editor_id
          WHERE edm.from_editor_id = $1 OR edm.to_editor_id = $1
        ) sub
        ORDER BY other_id, last_at DESC
      `, [myId]);
      res.json(rows);
    } catch (error) {
      console.error("DM conversations error:", error);
      res.status(500).json({ message: "Failed to load conversations" });
    }
  });

  // GET /api/editor/direct-messages/:editorId — full thread with a specific editor
  app.get("/api/editor/direct-messages/:editorId", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const otherId = req.params.editorId;
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        SELECT edm.id, edm.from_editor_id, edm.to_editor_id, edm.content, edm.is_read, edm.created_at,
               u.first_name AS sender_name
        FROM editor_direct_messages edm
        JOIN users u ON u.id = edm.from_editor_id
        WHERE (edm.from_editor_id = $1 AND edm.to_editor_id = $2)
           OR (edm.from_editor_id = $2 AND edm.to_editor_id = $1)
        ORDER BY edm.created_at ASC
      `, [myId, otherId]);
      // Mark incoming messages as read
      await pool.query(`
        UPDATE editor_direct_messages
        SET is_read = true
        WHERE to_editor_id = $1 AND from_editor_id = $2 AND is_read = false
      `, [myId, otherId]);
      res.json(rows);
    } catch (error) {
      console.error("DM thread error:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  });

  // POST /api/editor/direct-messages/:editorId — send a message to another editor
  app.post("/api/editor/direct-messages/:editorId", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const toId = req.params.editorId;
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        INSERT INTO editor_direct_messages (from_editor_id, to_editor_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [myId, toId, content.trim()]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Send DM error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // GET /api/editor/direct-messages/unread-count — badge count for nav
  app.get("/api/editor/dm-unread", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        SELECT COUNT(*) as count
        FROM editor_direct_messages
        WHERE to_editor_id = $1 AND is_read = false
      `, [myId]);
      res.json({ count: Number(rows[0]?.count || 0) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  registerEditorialRoomRoutes(app);
      registerServiceInquiryRoutes(app);
    registerEditorialOrderRoutes(app);
    registerWritingLayoutRoutes(app);
    registerWritingExerciseRoutes(app);
    registerJournalApplicationRoutes(app);
  registerMarketplaceRoutes(app);
  registerPoemWeavingRoutes(app);
  registerCopyAgentRoutes(app);
  registerEditorialBriefRoutes(app);
  registerSocialFeedRoutes(app);
  registerPromptFloaterRoutes(app);
  registerDesignAgentRoutes(app);
    registerAgentSystemRoutes(app);
    registerAgentPatternRoutes(app);
    registerAgentActivityDashboardRoutes(app);
  registerEicCommandCentreRoutes(app);
    registerGalleryDiscoverRoutes(app);
  registerOpenCallsRoutes(app);
    registerPoetMonetisationRoutes(app);
    registerInstagramSquaresRoutes(app);
    registerAuthorEditorConversationRoutes(app);
  registerTakeoverScreenRoutes(app);
  return httpServer;
}
