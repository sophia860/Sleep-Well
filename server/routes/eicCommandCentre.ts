import type { Express, Request, Response, NextFunction } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { isEditorInChief } from "./middleware";
import { storage } from "../storage";
import { db } from "../db";
import { eq, and, sql, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { users, writings, ritualSessions, innerWeather, reflections, growthJournalEntries, pollinations, savedPieces, resonances, circles, circleMembers, circleShares } from "@shared/schema";

export function registerEicCommandCentreRoutes(app: Express) {
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

  // === AI Agent Chat (from old eicCommandCentre Router) ===
  const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
    design:
      "You are the Design Intelligence agent for The Page Gallery Journal. " +
      "You govern visual identity: CSS, GSAP animations, typography, colour palettes, and layout. " +
      "Stay absolutely loyal to the dream-museum aesthetic — deep navy #0d1e2d, warm cream #f0eeea, gold #c4a24d. " +
      "Your suggestions are surgical and production-ready.",
    writers:
      "You are the Garden Vision agent for The Page Gallery Journal. " +
      "You manage everything related to the writer experience: Garden.tsx, seed-to-bloom writing stages, " +
      "writer profiles, the inner weather system, and ritual sessions. " +
      "You understand the emotional arc a writer takes from raw seed through to published bloom.",
    exhibitions:
      "You are the Exhibitions Curator agent for The Page Gallery Journal. " +
      "You handle the poetry gallery and poem exhibitions feature: GSAP scroll experiences, " +
      "mood detection, hand-illustrated character assets, and curated gallery layouts. " +
      "You understand how to turn a collection of poems into an immersive visual journey.",
    monetisation:
      "You are the Monetisation Builder agent for The Page Gallery Journal. " +
      "You build Stripe and PayPal features, subscription tiers, pricing pages, checkout flows, " +
      "and MRR dashboards. You always use verified, production-tested webhook patterns.",
    caleb_studio:
      "You are the Studio Keeper agent for Caleb's editorial studio within The Page Gallery Journal. " +
      "You maintain and enhance Caleb's editorial workflow: his writing tools, editorial briefs, " +
      "feedback systems, and personalised studio features. " +
      "You ensure Caleb's experience is polished, consistent, and reflects his editorial voice.",
    giove_studio:
      "You are the Studio Keeper agent for Giove's editorial studio within The Page Gallery Journal. " +
      "You maintain and enhance Giove's editorial workflow: his writing tools, editorial briefs, " +
      "feedback systems, and personalised studio features. " +
      "You ensure Giove's experience is polished, consistent, and reflects his editorial voice.",
    conductor:
      "You are the Command Conductor. Your job is to receive the EIC's brief, " +
      "decompose it into subtasks, and assign them to the specialised agents.",
    genius_coder:
      "You are the Genius Coder. You handle complex architecture, migrations, and difficult logic. " +
      "You write production-grade TypeScript, Express, and Drizzle ORM code.",
    fix_debug:
      "You are the Fix & Debug agent. You hunt bugs, regressions, and build errors. " +
      "You write minimal, safe fixes and verify them.",
    gitops:
      "You are the GitOps Integrator. You manage branches, commits, PRs, and the deployment rail.",
    visual:
      "You are the Visual Refactor agent. You govern CSS, GSAP, motion, and typography. " +
      "Stay loyal to the dream-museum aesthetic.",
    garden:
      "You are the Garden Vision agent. You turn ideas into immersive features for Garden.tsx.",
    literary:
      "You are the Literary Perfection agent. You hold the editorial standard " +
      "(Didion / Atwood / Sontag) for all platform copy and logic.",
    qa:
      "You are the QA Sentinel. You run smoke tests, verify breakpoints, " +
      "and check for console errors before anything ships.",
    keeper:
      "You are the Studio Keeper. You maintain Caleb and Giove's studios, " +
      "ensuring parity, consistency, and general upkeep.",
  };

  function isEIC(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;
    const email = user?.claims?.email ?? user?.email;
    if (email !== "sophiamaybea@gmail.com") {
      return res.status(403).json({ error: "EIC access only" });
    }
    next();
  }

  app.post("/api/eic/command-centre/agent/chat", isAuthenticated, isEIC, async (req: Request, res: Response) => {
    try {
      const { agentType, userMessage, conversationHistory } = req.body as {
        agentType: string;
        userMessage: string;
        conversationHistory?: { role: "user" | "assistant"; content: string }[];
      };
      const systemPrompt =
        AGENT_SYSTEM_PROMPTS[agentType] ?? AGENT_SYSTEM_PROMPTS.conductor;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...(conversationHistory || []),
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      });
      res.json({ reply: completion.choices[0].message.content, agentType });
    } catch (error) {
      console.error("[EIC agent/chat] Error:", error);
      res.status(500).json({
        error: "Failed to process agent chat",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

}
