import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { db } from "../db";
import { courses, courseLessons } from "@shared/schema";

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

export function registerCoursesRoutes(app: Express) {
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

      const { db: dbInst } = await import("../db");

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

}
