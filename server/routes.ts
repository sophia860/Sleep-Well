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
import { registerTakeoverScreenRoutes } from "./routes/takeoverScreens";
import { registerGalleryDiscoverRoutes } from "./routes/galleryDiscover";
import { registerInstagramSquaresRoutes } from "./routes/instagramSquares";
import { registerOpenCallsRoutes } from "./routes/openCalls";
import { registerPoetMonetisationRoutes } from "./routes/poetMonetisation";
import { registerWritingsRoutes } from "./routes/writings";
import { registerPromptsRoutes } from "./routes/prompts";
import { registerGardenRoutes } from "./routes/garden";
import { registerCirclesRoutes } from "./routes/circles";
import { registerReadingQueueRoutes } from "./routes/readingQueue";
import { registerPollinationsRoutes } from "./routes/pollinations";
import { registerRitualsRoutes } from "./routes/rituals";
import { registerSubmissionsRoutes } from "./routes/submissions";
import { registerRootInfluencesRoutes } from "./routes/rootInfluences";
import { registerMoonlitReadingsRoutes } from "./routes/moonlitReadings";
import { registerResonancesRoutes } from "./routes/resonances";
import { registerMarginaliaRoutes } from "./routes/marginalia";
import { registerNotificationsRoutes } from "./routes/notifications";
import { registerTablesRoutes } from "./routes/tables";
import { registerWorkshopRoutes } from "./routes/workshop";
import { registerUsersRoutes } from "./routes/users";
import { registerEditorialRoutes } from "./routes/editorial";
import { registerEditorRoutes } from "./routes/editor";
import { registerOpportunitiesRoutes } from "./routes/opportunities";
import { registerLettersRoutes } from "./routes/letters";
import { registerFirstReaderRoutes } from "./routes/firstReader";
import { registerWriterProfilesRoutes } from "./routes/writerProfiles";
import { registerCoursesRoutes } from "./routes/courses";
import { registerChallengesRoutes } from "./routes/challenges";
import { registerCommunityRoutes } from "./routes/community";
import { registerEicCommandCentreRoutes } from "./routes/eicCommandCentre";
import { registerExhibitsRoutes } from "./routes/exhibits";
import { registerCommonsRoutes } from "./routes/commons";
import { registerBouquetsRoutes } from "./routes/bouquets";
import { registerMoodboardsRoutes } from "./routes/moodboards";
import { registerSoilRoutes } from "./routes/soil";
import { registerGalleryCommentsRoutes } from "./routes/galleryComments";
import { registerAdminRoutes } from "./routes/admin";
import { registerMessagingRoutes } from "./routes/messaging";
import { registerEditorialWaitlistRoutes } from "./routes/editorialWaitlist";
import { registerPaypalRoutes } from "./routes/paypal";
import { registerBoardPostsRoutes } from "./routes/boardPosts";
import { registerGroveRoutes } from "./routes/grove";
import { registerNewsletterRoutes } from "./routes/newsletter";
import { registerStudioRoutes } from "./routes/studio";
import { registerCollectionsRoutes } from "./routes/collections";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

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

  app.get("/robots.txt", (_req, res) => {
    res
      .type("text/plain")
      .send(
        `User-agent: *\nAllow: /\nDisallow: /garden\nDisallow: /edit-profile\nDisallow: /editor-studio\nDisallow: /eic-dashboard\nDisallow: /api/\n\nSitemap: ${_req.protocol}://${_req.get("host")}/sitemap.xml`,
      );
  });

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

  // Register existing route modules
  registerCopyAgentRoutes(app);
  registerEditorialBriefRoutes(app);
  registerSocialFeedRoutes(app);
  registerPromptFloaterRoutes(app);
  registerDesignAgentRoutes(app);
  registerGalleryFeedbackRoutes(app);
  registerEditorialRoomRoutes(app);
  registerServiceInquiryRoutes(app);
  registerEditorialOrderRoutes(app);
  registerWritingLayoutRoutes(app);
  registerWritingExerciseRoutes(app);
  registerJournalApplicationRoutes(app);
  registerMarketplaceRoutes(app);
  registerPoemWeavingRoutes(app);
  registerAgentSystemRoutes(app);
  registerAgentPatternRoutes(app);
  registerAgentActivityDashboardRoutes(app);
  registerTakeoverScreenRoutes(app);
  registerGalleryDiscoverRoutes(app);
  registerInstagramSquaresRoutes(app);
  registerOpenCallsRoutes(app);
  registerPoetMonetisationRoutes(app);

  // Register extracted route modules
  registerWritingsRoutes(app);
  registerPromptsRoutes(app);
  registerGardenRoutes(app);
  registerCirclesRoutes(app);
  registerReadingQueueRoutes(app);
  registerPollinationsRoutes(app);
  registerRitualsRoutes(app);
  registerSubmissionsRoutes(app);
  registerRootInfluencesRoutes(app);
  registerMoonlitReadingsRoutes(app);
  registerResonancesRoutes(app);
  registerMarginaliaRoutes(app);
  registerNotificationsRoutes(app);
  registerTablesRoutes(app);
  registerWorkshopRoutes(app);
  registerUsersRoutes(app);
  registerEditorialRoutes(app);
  registerEditorRoutes(app);
  registerOpportunitiesRoutes(app);
  registerLettersRoutes(app);
  registerFirstReaderRoutes(app);
  registerWriterProfilesRoutes(app);
  registerCoursesRoutes(app);
  registerChallengesRoutes(app);
  registerCommunityRoutes(app);
  registerEicCommandCentreRoutes(app);
  registerExhibitsRoutes(app);
  registerCommonsRoutes(app);
  registerBouquetsRoutes(app);
  registerMoodboardsRoutes(app);
  registerSoilRoutes(app);
  registerGalleryCommentsRoutes(app);
  registerAdminRoutes(app);
  registerMessagingRoutes(app);
  registerEditorialWaitlistRoutes(app);
  registerPaypalRoutes(app);
  registerBoardPostsRoutes(app);
  registerGroveRoutes(app);
  registerNewsletterRoutes(app);
  registerStudioRoutes(app);
  registerCollectionsRoutes(app);

  return httpServer;
}
