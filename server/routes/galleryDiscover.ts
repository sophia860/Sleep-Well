import { type Express } from "express";
import { db } from "../db";
import { writings, resonances, quietReads, users } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export function registerGalleryDiscoverRoutes(app: Express) {
  // Featured: gallery opt-in writings, published, ordered by resonance count desc
  app.get("/api/gallery/featured", async (req, res) => {
    try {
      const featured = await db
        .select({
          id: writings.id,
          title: writings.title,
          content: writings.content,
          genre: writings.genre,
          authorId: writings.authorId,
          authorName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', COALESCE(${users.lastName}, '')))`.as("author_name"),
          publishedAt: writings.publishedAt,
          createdAt: writings.createdAt,
          layout: writings.layout,
          tags: writings.tags,
          resonanceCount: sql<number>`(SELECT COUNT(*) FROM resonances WHERE writing_id = ${writings.id})`.as("resonance_count"),
        })
        .from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(
          and(
            eq(writings.galleryOptIn, true),
            eq(writings.isPublished, true)
          )
        )
        .orderBy(desc(sql`(SELECT COUNT(*) FROM resonances WHERE writing_id = ${writings.id})`))
        .limit(20);
      res.json(featured);
    } catch (error) {
      console.error("[gallery/featured]", error);
      res.status(500).json({ error: "Failed to fetch featured writings" });
    }
  });

  // New Voices: gallery opt-in writings, published, ordered by publishedAt desc (newest first)
  app.get("/api/gallery/new-voices", async (req, res) => {
    try {
      const newVoices = await db
        .select({
          id: writings.id,
          title: writings.title,
          content: writings.content,
          genre: writings.genre,
          authorId: writings.authorId,
          authorName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', COALESCE(${users.lastName}, '')))`.as("author_name"),
          publishedAt: writings.publishedAt,
          createdAt: writings.createdAt,
          layout: writings.layout,
          tags: writings.tags,
        })
        .from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(
          and(
            eq(writings.galleryOptIn, true),
            eq(writings.isPublished, true)
          )
        )
        .orderBy(desc(writings.publishedAt))
        .limit(20);
      res.json(newVoices);
    } catch (error) {
      console.error("[gallery/new-voices]", error);
      res.status(500).json({ error: "Failed to fetch new voices" });
    }
  });

  // Trending: gallery opt-in writings ordered by quiet read count (last 30 days)
  app.get("/api/gallery/trending", async (req, res) => {
    try {
      const trending = await db
        .select({
          id: writings.id,
          title: writings.title,
          content: writings.content,
          genre: writings.genre,
          authorId: writings.authorId,
          authorName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', COALESCE(${users.lastName}, '')))`.as("author_name"),
          publishedAt: writings.publishedAt,
          createdAt: writings.createdAt,
          layout: writings.layout,
          tags: writings.tags,
          readCount: sql<number>`(SELECT COUNT(*) FROM quiet_reads WHERE writing_id = ${writings.id} AND created_at > NOW() - INTERVAL '30 days')`.as("read_count"),
        })
        .from(writings)
        .leftJoin(users, eq(writings.authorId, users.id))
        .where(
          and(
            eq(writings.galleryOptIn, true),
            eq(writings.isPublished, true)
          )
        )
        .orderBy(desc(sql`(SELECT COUNT(*) FROM quiet_reads WHERE writing_id = ${writings.id} AND created_at > NOW() - INTERVAL '30 days')`))
        .limit(20);
      res.json(trending);
    } catch (error) {
      console.error("[gallery/trending]", error);
      res.status(500).json({ error: "Failed to fetch trending writings" });
    }
  });
}
