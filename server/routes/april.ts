import { type Express } from "express";
import { db } from "../db";
import { writings, users } from "@shared/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

// ─── April Prompt Sequence (30 daily prompts for National Poetry Month) ───────
const APRIL_PROMPTS = [
  { day: 1,  text: "Write about a door left open.",                        category: "image" },
  { day: 2,  text: "What colour is silence?",                               category: "sensory" },
  { day: 3,  text: "A letter to a season.",                                 category: "letter" },
  { day: 4,  text: "Begin with the word 'before'.",                        category: "prompt" },
  { day: 5,  text: "Describe a sound only you have heard.",                category: "sensory" },
  { day: 6,  text: "Write a poem in the shape of a question.",             category: "form" },
  { day: 7,  text: "Something broken that became more beautiful.",         category: "image" },
  { day: 8,  text: "A conversation between two bodies of water.",          category: "voice" },
  { day: 9,  text: "Write about waiting.",                                  category: "prompt" },
  { day: 10, text: "What you carry in your hands.",                        category: "image" },
  { day: 11, text: "A map of a place that no longer exists.",              category: "memory" },
  { day: 12, text: "Write from the perspective of a shadow.",              category: "voice" },
  { day: 13, text: "Begin with the last line of a dream.",                 category: "prompt" },
  { day: 14, text: "A love poem to a tool or object.",                     category: "ode" },
  { day: 15, text: "Write about mid-April: the year half-budded.",         category: "seasonal" },
  { day: 16, text: "Something wild in an ordinary place.",                 category: "image" },
  { day: 17, text: "The inside of an hour.",                               category: "time" },
  { day: 18, text: "Write about returning.",                               category: "prompt" },
  { day: 19, text: "A elegy for something not yet lost.",                  category: "elegy" },
  { day: 20, text: "What the garden knows that you don't.",                category: "voice" },
  { day: 21, text: "Begin with the word 'still'.",                         category: "prompt" },
  { day: 22, text: "Write about earth — soil, ground, bedrock.",           category: "element" },
  { day: 23, text: "A poem that ends in a question.",                      category: "form" },
  { day: 24, text: "What remains after the flood.",                        category: "image" },
  { day: 25, text: "The smell of something you can't name.",               category: "sensory" },
  { day: 26, text: "Write a blessing for something small.",                category: "blessing" },
  { day: 27, text: "What you keep meaning to say.",                        category: "voice" },
  { day: 28, text: "A poem about a threshold.",                            category: "image" },
  { day: 29, text: "Write about the last day of something.",               category: "elegy" },
  { day: 30, text: "What April taught you about your own writing.",        category: "reflection" },
];

export function registerAprilRoutes(app: Express) {
  // ── GET /api/april/prompt-of-day ─────────────────────────────────────────
  // Returns the prompt for today's day-of-month (1–30).
  // Used by AprilPromptBanner component. Requires no auth.
  app.get("/api/april/prompt-of-day", (_req, res) => {
    const day = new Date().getDate(); // 1-31
    const prompt = APRIL_PROMPTS.find((p) => p.day === day)
      ?? APRIL_PROMPTS[APRIL_PROMPTS.length - 1];
    return res.json({ ...prompt, id: `april-${prompt.day}` });
  });

  // ── GET /api/april/all-prompts ────────────────────────────────────────────
  // Returns all 30 April prompts. Used by the /april page.
  app.get("/api/april/all-prompts", (_req, res) => {
    return res.json(
      APRIL_PROMPTS.map((p) => ({ ...p, id: `april-${p.day}` }))
    );
  });

  // ── GET /api/april/pocket/:username ──────────────────────────────────────
  // Returns a writer's public garden pieces created during April of the
  // current year. No auth required — pocket pages are public.
  app.get("/api/april/pocket/:username", async (req, res) => {
    try {
      const { username } = req.params;

      const [user] = await db
        .select({ id: users.id, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, username))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Writer not found" });
      }

      const year = new Date().getFullYear();
      const aprilStart = new Date(`${year}-04-01T00:00:00.000Z`);
      const mayStart   = new Date(`${year}-05-01T00:00:00.000Z`);

      const pieces = await db
        .select({
          id: writings.id,
          title: writings.title,
          content: writings.content,
          genre: writings.genre,
          stage: writings.stage,
          createdAt: writings.createdAt,
          tags: writings.tags,
        })
        .from(writings)
        .where(
          and(
            eq(writings.authorId, user.id),
            eq(writings.isPublicGarden, true),
            gte(writings.createdAt, aprilStart),
            lt(writings.createdAt, mayStart)
          )
        )
        .orderBy(desc(writings.createdAt))
        .limit(50);

      return res.json({
        user: {
          id: user.id,
          displayName: user.displayName,
          username: user.id,
        },
        pieces,
        year,
      });
    } catch (err) {
      console.error("april/pocket error:", err);
      return res.status(500).json({ message: "Failed to load pocket" });
    }
  });
}
