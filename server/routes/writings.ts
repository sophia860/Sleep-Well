import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { db } from "../db";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from "docx";
import { insertWritingSchema, updateWritingSchema, writings } from "@shared/schema";

export function registerWritingsRoutes(app: Express) {
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

}
