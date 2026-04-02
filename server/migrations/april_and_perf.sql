-- ============================================================
-- MIGRATION: April NPM Features + Performance Columns
-- Run in Supabase SQL editor BEFORE deploying
-- Safe: all IF NOT EXISTS guards, all nullable/DEFAULT
-- ============================================================

-- Feature 1 & 3: April Prompt Sequence + Prompt-Linked Badge
-- Links a writing to an April daily prompt (nullable FK to table_topics)
ALTER TABLE writings
  ADD COLUMN IF NOT EXISTS april_prompt_id varchar DEFAULT NULL;

-- Feature 5: Poem in Your Pocket
-- One boolean per writing; unique partial index enforces one per user
ALTER TABLE writings
  ADD COLUMN IF NOT EXISTS is_pocket_poem boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS one_pocket_poem_per_user
  ON writings(author_id)
  WHERE is_pocket_poem = true;

-- Feature 2: Bloom Map — no schema change needed (reads existing writings)
-- Feature 4: April Reading Room — no schema change needed (reads gallery_opt_in)

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'writings'
  AND column_name IN ('april_prompt_id', 'is_pocket_poem')
ORDER BY column_name;
