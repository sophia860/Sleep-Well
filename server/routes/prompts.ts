import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { and, sql } from "drizzle-orm";
import { dailyPrompts } from "@shared/schema";

export function registerPromptsRoutes(app: Express) {
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

}
