import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 3, // T18 reverted — Supabase Session mode pool_size exhaustion on Render deploy
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected pool error:", err);
});
export const db = drizzle(pool, { schema });

// Helper: returns true if the error is a benign "already exists" type
// that is expected during idempotent migrations.
function isBenignMigrationError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
  return (
    msg.includes("already exists") ||
    msg.includes("duplicate column") ||
    msg.includes("duplicate table")
  );
}

// Run database migrations on startup
export async function runMigrations() {
  // T19: track non-trivial migration errors
  let migrationErrors = 0;

  try {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER users password_hash failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER users display_name failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS submission_calls (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          editor_id varchar NOT NULL REFERENCES users(id),
          title text NOT NULL,
          description text NOT NULL,
          genre text,
          word_limit integer,
          deadline timestamp,
          status text NOT NULL DEFAULT 'open',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE submission_calls failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS submission_call_responses (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          call_id varchar NOT NULL REFERENCES submission_calls(id),
          writer_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar REFERENCES writings(id),
          note text,
          status text NOT NULL DEFAULT 'submitted',
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE submission_call_responses failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER users is_anonymous failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER users has_completed_onboarding failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE writings ADD COLUMN IF NOT EXISTS marginalia_visibility text NOT NULL DEFAULT 'public';
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER writings marginalia_visibility failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE writings ADD COLUMN IF NOT EXISTS gallery_opt_in boolean NOT NULL DEFAULT false;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER writings gallery_opt_in failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE writings ADD COLUMN IF NOT EXISTS gallery_opt_in_at timestamp;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER writings gallery_opt_in_at failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS theme text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls theme failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS prompt text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls prompt failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS issue_id varchar;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls issue_id failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS starts_at timestamp;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls starts_at failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS ends_at timestamp;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls ends_at failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS flag_limit integer NOT NULL DEFAULT 3;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls flag_limit failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ADD COLUMN IF NOT EXISTS created_by_id varchar;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls created_by_id failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ALTER COLUMN editor_id DROP NOT NULL;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls editor_id DROP NOT NULL failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE submission_calls ALTER COLUMN description DROP NOT NULL;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER submission_calls description DROP NOT NULL failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Circles feature
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS circles (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text DEFAULT '',
          created_by_id varchar NOT NULL REFERENCES users(id),
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE circles failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS circle_members (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          circle_id varchar NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
          user_id varchar NOT NULL REFERENCES users(id),
          role text NOT NULL DEFAULT 'member',
          joined_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE circle_members failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE writings ADD COLUMN IF NOT EXISTS circle_id varchar REFERENCES circles(id);
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER writings circle_id failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Add layout column to writings table (schema defines it in shared/schema.ts)
    try {
      await pool.query(`
        ALTER TABLE writings ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'single';
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER writings layout failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE circles ADD COLUMN IF NOT EXISTS theme text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER circles theme failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE circles ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 5;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER circles max_members failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_content (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          page_key text NOT NULL,
          section_key text NOT NULL,
          content text NOT NULL,
          content_type text NOT NULL DEFAULT 'text',
          label text NOT NULL,
          group_label text,
          sort_order integer DEFAULT 0,
          updated_by varchar REFERENCES users(id),
          updated_at timestamp DEFAULT now(),
          created_at timestamp DEFAULT now(),
          UNIQUE(page_key, section_key)
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE site_content failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS appreciations (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar NOT NULL REFERENCES writings(id),
          created_at timestamp DEFAULT now(),
          UNIQUE(user_id, writing_id)
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE appreciations failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS letters (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar NOT NULL REFERENCES writings(id),
          content text NOT NULL,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE letters failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // FIX(Finding 13): Create editor_notes table if it doesn't exist (fresh DB safety)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editor_notes (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          writing_id varchar NOT NULL REFERENCES writings(id),
          editor_id varchar NOT NULL REFERENCES users(id),
          content text NOT NULL,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE editor_notes failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE editor_notes ADD COLUMN IF NOT EXISTS note_type text NOT NULL DEFAULT 'general_feedback';
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER editor_notes note_type failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_waitlist (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          email text NOT NULL UNIQUE,
          genre text NOT NULL DEFAULT 'poetry',
          manuscript_type text NOT NULL DEFAULT 'poetry_collection',
          estimated_word_count integer,
          brief text,
          status text NOT NULL DEFAULT 'pending',
          sophia_note text,
          quoted_price integer,
          payment_confirmed boolean NOT NULL DEFAULT false,
          paypal_order_id text,
          payment_token text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editorial_waitlist failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE editorial_waitlist ADD COLUMN IF NOT EXISTS payment_token text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER editorial_waitlist payment_token failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Grove botanical social layer
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS grove_plants (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          name text NOT NULL,
          species text,
          nickname text,
          image_url text,
          watering_frequency_days integer DEFAULT 7,
          last_watered_at timestamp,
          next_water_due timestamp,
          is_public boolean NOT NULL DEFAULT false,
          notes text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE grove_plants failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS grove_watering_sessions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          plant_id varchar NOT NULL REFERENCES grove_plants(id),
          user_id varchar NOT NULL REFERENCES users(id),
          watered_at timestamp DEFAULT now(),
          notes text
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE grove_watering_sessions failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS grove_connections (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_id varchar NOT NULL REFERENCES users(id),
          following_id varchar NOT NULL REFERENCES users(id),
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE grove_connections failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS grove_seed_packets (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id varchar NOT NULL REFERENCES users(id),
          recipient_id varchar NOT NULL REFERENCES users(id),
          plant_id varchar REFERENCES grove_plants(id),
          message text,
          seed_type text NOT NULL,
          is_opened boolean NOT NULL DEFAULT false,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE grove_seed_packets failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          email text NOT NULL UNIQUE,
          subscribed_at timestamp with time zone DEFAULT now(),
          source text DEFAULT 'homepage'
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE newsletter_subscribers failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Editorial tasks table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_tasks (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          description text,
          assigned_editor_id varchar REFERENCES users(id),
          created_by_editor_id varchar NOT NULL REFERENCES users(id),
          status varchar(32) NOT NULL DEFAULT 'open',
          due_date timestamp,
          issue_id varchar,
          writing_id varchar REFERENCES writings(id),
          sort_order integer NOT NULL DEFAULT 0,
          task_type text NOT NULL DEFAULT 'ops',
          board_column text NOT NULL DEFAULT 'inbox',
          completed_at timestamp,
          notify_on_complete boolean NOT NULL DEFAULT true,
          priority text NOT NULL DEFAULT 'medium',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editorial_tasks failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Editorial threads table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_threads (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          subject text NOT NULL,
          writing_id varchar REFERENCES writings(id),
          created_by_editor_id varchar NOT NULL REFERENCES users(id),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editorial_threads failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Editorial thread messages table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_thread_messages (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          thread_id varchar NOT NULL REFERENCES editorial_threads(id) ON DELETE CASCADE,
          author_id varchar NOT NULL REFERENCES users(id),
          body text NOT NULL,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editorial_thread_messages failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Editor task comments table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editor_task_comments (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id varchar NOT NULL REFERENCES editorial_tasks(id) ON DELETE CASCADE,
          author_id varchar NOT NULL REFERENCES users(id),
          content text NOT NULL,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editor_task_comments failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Garden Walk submissions
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS garden_walk_submissions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          writer_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar NOT NULL REFERENCES writings(id),
          editor_id varchar REFERENCES users(id),
          status text NOT NULL DEFAULT 'submitted',
          writer_note text,
          editor_feedback text,
          walk_type text NOT NULL DEFAULT 'review',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE garden_walk_submissions failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Writer-editor messages for Garden Walk feedback threads
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS garden_walk_messages (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          submission_id varchar NOT NULL REFERENCES garden_walk_submissions(id) ON DELETE CASCADE,
          sender_id varchar NOT NULL REFERENCES users(id),
          content text NOT NULL,
          message_type text NOT NULL DEFAULT 'feedback',
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE garden_walk_messages failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        DO $$ BEGIN ALTER TABLE garden_walk_submissions ALTER COLUMN writing_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER garden_walk_submissions writing_id nullable failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE garden_walk_submissions ADD COLUMN IF NOT EXISTS title text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER garden_walk_submissions title failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE garden_walk_submissions ADD COLUMN IF NOT EXISTS excerpt text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER garden_walk_submissions excerpt failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE garden_walk_submissions ADD COLUMN IF NOT EXISTS genre text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER garden_walk_submissions genre failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE garden_walk_submissions ADD COLUMN IF NOT EXISTS sender_name text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER garden_walk_submissions sender_name failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Service inquiries table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS service_inquiries (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          email text NOT NULL,
          service_type text NOT NULL,
          message text NOT NULL,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE service_inquiries failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // T46: editorial_flags table — must exist before rejection_feedback_requests references it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_flags (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          writing_id varchar NOT NULL REFERENCES writings(id),
          author_id varchar NOT NULL REFERENCES users(id),
          status text NOT NULL DEFAULT 'flagged',
          is_paid_flag boolean NOT NULL DEFAULT false,
          seen_by_editor_id varchar REFERENCES users(id),
          seen_at timestamp,
          editor_response text,
          responded_at timestamp,
          decision text NOT NULL DEFAULT 'pending',
          free_note text,
          free_note_sent_at timestamp,
          is_publishable boolean NOT NULL DEFAULT false,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE editorial_flags failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // T46: Rejection feedback requests table — flag_id included inline so fresh
    // installs get the NOT NULL FK constraint without needing the ALTER below.
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rejection_feedback_requests (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          writing_id varchar NOT NULL REFERENCES writings(id),
          author_id varchar NOT NULL REFERENCES users(id),
          flag_id varchar NOT NULL REFERENCES editorial_flags(id),
          tier text NOT NULL DEFAULT 'free',
          status text NOT NULL DEFAULT 'requested',
          paid_amount_pence integer NOT NULL DEFAULT 0,
          payment_confirmed boolean NOT NULL DEFAULT false,
          paypal_order_id text,
          editor_letter text,
          delivered_at timestamp,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE rejection_feedback_requests failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Safety-net ALTER for existing DBs that have the table without flag_id.
    // nullable here intentionally — existing rows cannot supply a NOT NULL value retroactively.
    try {
      await pool.query(`
        ALTER TABLE rejection_feedback_requests
          ADD COLUMN IF NOT EXISTS flag_id varchar REFERENCES editorial_flags(id);
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: ALTER rejection_feedback_requests flag_id failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Writing exercises feature
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS writing_exercises (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          created_by_id varchar NOT NULL REFERENCES users(id),
          title text NOT NULL,
          prompt text NOT NULL,
          guidance_note text,
          genre text NOT NULL DEFAULT 'any',
          word_limit integer,
          closes_at timestamp,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE writing_exercises failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS exercise_submissions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          exercise_id varchar NOT NULL REFERENCES writing_exercises(id) ON DELETE CASCADE,
          author_id varchar NOT NULL REFERENCES users(id),
          content text NOT NULL,
          status text NOT NULL DEFAULT 'submitted',
          editor_note text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE exercise_submissions failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Journal applications table — full schema
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS journal_applications (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          journal_name text NOT NULL,
          contact_name text NOT NULL,
          email text NOT NULL,
          website text,
          instagram_handle text,
          founded_year text,
          genres_focus text NOT NULL,
          current_submission_platform text,
          submissions_per_year text,
          staff_size text,
          editorial_statement text NOT NULL,
          why_the_garden text NOT NULL,
          pays_contributors boolean NOT NULL DEFAULT false,
          payment_note text,
          tier text NOT NULL DEFAULT 'reading_room',
          status text NOT NULL DEFAULT 'pending',
          editor_note text,
          reviewed_at timestamp,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error("[MIGRATION CRITICAL]: CREATE journal_applications failed:", (e as Error).message);
        migrationErrors++;
      }
    }

    // Backfill any missing columns on journal_applications for existing DBs
    const jaBackfills: Array<[string, string]> = [
      ["contact_name", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS contact_name text NOT NULL DEFAULT '';`],
      ["instagram_handle", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS instagram_handle text;`],
      ["founded_year", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS founded_year text;`],
      ["genres_focus", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS genres_focus text NOT NULL DEFAULT '';`],
      ["current_submission_platform", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS current_submission_platform text;`],
      ["submissions_per_year", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS submissions_per_year text;`],
      ["staff_size", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS staff_size text;`],
      ["editorial_statement", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS editorial_statement text NOT NULL DEFAULT '';`],
      ["why_the_garden", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS why_the_garden text NOT NULL DEFAULT '';`],
      ["pays_contributors", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS pays_contributors boolean NOT NULL DEFAULT false;`],
      ["payment_note", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS payment_note text;`],
      ["tier", `ALTER TABLE journal_applications ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'reading_room';`],
    ];
    for (const [col, sql] of jaBackfills) {
      try {
        await pool.query(sql);
      } catch (e) {
        if (!isBenignMigrationError(e)) {
          console.error(`[MIGRATION CRITICAL]: ALTER journal_applications ${col} failed:`, (e as Error).message);
          migrationErrors++;
        }
      }
    }

    // Marketplace tables — writer_services, service_bookings, tip_jars, tip_transactions
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS writer_services (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id varchar NOT NULL REFERENCES users(id),
          title text NOT NULL,
          description text NOT NULL DEFAULT '',
          service_type text NOT NULL DEFAULT 'manuscript_feedback',
          price_pence integer NOT NULL,
          delivery_days integer NOT NULL DEFAULT 7,
          currency text NOT NULL DEFAULT 'gbp',
          is_active boolean NOT NULL DEFAULT true,
          stripe_price_id text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE writer_services failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS service_bookings (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          service_id varchar NOT NULL REFERENCES writer_services(id),
          client_id varchar NOT NULL REFERENCES users(id),
          note text,
          price_pence integer NOT NULL,
          currency text NOT NULL DEFAULT 'gbp',
          status text NOT NULL DEFAULT 'pending_payment',
          stripe_session_id text,
          stripe_payment_intent_id text,
          payment_confirmed boolean NOT NULL DEFAULT false,
          paid_at timestamp,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE service_bookings failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tip_jars (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id varchar NOT NULL UNIQUE REFERENCES users(id),
          is_active boolean NOT NULL DEFAULT false,
          message text NOT NULL DEFAULT 'Buy me a coffee',
          suggested_amount_pence integer NOT NULL DEFAULT 300,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE tip_jars failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tip_transactions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          tip_jar_id varchar NOT NULL REFERENCES tip_jars(id),
          tipper_id varchar REFERENCES users(id),
          amount_pence integer NOT NULL,
          currency text NOT NULL DEFAULT 'gbp',
          stripe_session_id text,
          stripe_payment_intent_id text,
          payment_confirmed boolean NOT NULL DEFAULT false,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE tip_transactions failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // Add paypal_order_id to service_bookings for PayPal payment capture
    try {
      await pool.query(`
        ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS paypal_order_id text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER service_bookings paypal_order_id failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // Add paypal_order_id to tip_transactions for PayPal payment capture
    try {
      await pool.query(`
        ALTER TABLE tip_transactions ADD COLUMN IF NOT EXISTS paypal_order_id text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER tip_transactions paypal_order_id failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // T22: Create feed_events table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feed_events (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          actor_id varchar NOT NULL REFERENCES users(id),
          event_type text NOT NULL,
          writing_id varchar REFERENCES writings(id),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          is_read boolean NOT NULL DEFAULT false,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE feed_events failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // T23: Create agent_notifications table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_notifications (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          agent_name text NOT NULL,
          message text,
          writing_id varchar REFERENCES writings(id),
          read_at timestamp,
          dismissed_at timestamp,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE agent_notifications failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // T24: Create agent_pattern_insights table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_pattern_insights (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          insight_type text NOT NULL,
          title text NOT NULL,
          description text,
          writing_ids text[],
          status text NOT NULL DEFAULT 'active',
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE agent_pattern_insights failed:', (e as Error).message);
        migrationErrors++;
      }
    }

        // T24b: Add missing columns to agent_pattern_insights for scheduler compatibility
    try {
      await pool.query(`ALTER TABLE agent_pattern_insights ADD COLUMN IF NOT EXISTS summary text;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER agent_pattern_insights summary failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE agent_pattern_insights ADD COLUMN IF NOT EXISTS source_writing_ids text[];`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER agent_pattern_insights source_writing_ids failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE agent_pattern_insights ADD COLUMN IF NOT EXISTS pattern_data jsonb;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER agent_pattern_insights pattern_data failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE agent_pattern_insights ADD COLUMN IF NOT EXISTS dismissed_at timestamp;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER agent_pattern_insights dismissed_at failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // T25: Create copy_snapshots table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS copy_snapshots (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar REFERENCES writings(id),
          page_key text NOT NULL,
          section_key text NOT NULL,
          draft_copy text NOT NULL,
          approved_copy text,
          generated_by text NOT NULL DEFAULT 'agent',
          status text NOT NULL DEFAULT 'draft',
          approved_by_id varchar REFERENCES users(id),
          approved_at timestamp,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE copy_snapshots failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // T26: Create editorial_briefs table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS editorial_briefs (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar REFERENCES writings(id),
          brief_type text NOT NULL,
          content text NOT NULL,
          status text NOT NULL DEFAULT 'draft',
          approved_by_id varchar REFERENCES users(id),
          approved_at timestamp,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE editorial_briefs failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // EIC Command Centre tables
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS eic_agent_conversations (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_type varchar NOT NULL,
          messages jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE eic_agent_conversations failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS eic_feature_registry (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          target_editor varchar NOT NULL,
          feature_name varchar NOT NULL,
          feature_description text,
          status varchar NOT NULL DEFAULT 'proposed',
          built_by_agent boolean DEFAULT false,
          code_snippet text,
          task_notes text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE eic_feature_registry failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS poem_exhibitions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          slug varchar NOT NULL UNIQUE,
          description text,
          curator_notes text,
          poem_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
          mood varchar,
          illustration_urls jsonb DEFAULT '[]'::jsonb,
          gsap_config jsonb DEFAULT '{}'::jsonb,
          is_published boolean DEFAULT false,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE poem_exhibitions failed:', (e as Error).message);
        migrationErrors++;
      }
    }

// Atelier feature tables
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS atelier_series (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          slug varchar NOT NULL UNIQUE,
          description text,
          curator_id varchar NOT NULL REFERENCES users(id),
          status text NOT NULL DEFAULT 'draft',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE atelier_series failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS atelier_sessions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          series_id varchar NOT NULL REFERENCES atelier_series(id),
          title text NOT NULL,
          description text,
          session_date timestamp,
          sort_order integer NOT NULL DEFAULT 0,
          status text NOT NULL DEFAULT 'draft',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE atelier_sessions failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS atelier_prompts (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id varchar NOT NULL REFERENCES atelier_sessions(id),
          prompt_text text NOT NULL,
          guidance_note text,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: CREATE atelier_prompts failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: atelier_series new columns ---
    // Each ALTER has its own try/catch (consistent with the rest of runMigrations) so a
    // failure on one column doesn't silently skip the remaining columns.
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS created_by_id varchar NOT NULL DEFAULT '';`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series created_by_id failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS facilitator text NOT NULL DEFAULT 'The Editors';`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series facilitator failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS free_exercise_limit integer NOT NULL DEFAULT 2;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series free_exercise_limit failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS genre text NOT NULL DEFAULT 'any';`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series genre failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series is_published failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series sort_order failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS subtitle text;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series subtitle failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS theme text;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series theme failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE atelier_series ADD COLUMN IF NOT EXISTS total_exercises integer NOT NULL DEFAULT 0;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER atelier_series total_exercises failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: editorial_briefs new columns ---
    try {
      await pool.query(`ALTER TABLE editorial_briefs ADD COLUMN IF NOT EXISTS display_intro text NOT NULL DEFAULT '';`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_briefs display_intro failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE editorial_briefs ADD COLUMN IF NOT EXISTS draft_by_agent text;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_briefs draft_by_agent failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE editorial_briefs ADD COLUMN IF NOT EXISTS issue_id varchar;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_briefs issue_id failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE editorial_briefs ADD COLUMN IF NOT EXISTS seo_excerpt text NOT NULL DEFAULT '';`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_briefs seo_excerpt failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE editorial_briefs ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_briefs updated_at failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: editorial_threads new column ---
    try {
      await pool.query(`
        ALTER TABLE editorial_threads ADD COLUMN IF NOT EXISTS issue_id varchar;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_threads failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: editorial_threads status column ---
    try {
      await pool.query(`
        ALTER TABLE editorial_threads ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'open';
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER editorial_threads status failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: exercise_submissions new column ---
    try {
      await pool.query(`
        ALTER TABLE exercise_submissions ADD COLUMN IF NOT EXISTS garden_writing_id varchar REFERENCES writings(id);
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER exercise_submissions failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: service_bookings new columns ---
    try {
      await pool.query(`ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS delivered_at timestamp;`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER service_bookings delivered_at failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();`);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER service_bookings updated_at failed:', (e as Error).message);
        migrationErrors++;
      }
    }

    // --- Auto-migration: tip_jars new column ---
    try {
      await pool.query(`
        ALTER TABLE tip_jars ADD COLUMN IF NOT EXISTS stripe_product_id text;
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: ALTER tip_jars failed:', (e as Error).message);
        migrationErrors++;
      }
    }

        // --- T20: author_editor_conversations & author_editor_messages ---
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS author_editor_conversations (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id varchar NOT NULL REFERENCES users(id),
          writing_id varchar REFERENCES writings(id),
          subject text NOT NULL DEFAULT 'General',
          status text NOT NULL DEFAULT 'open',
          last_sender_id varchar REFERENCES users(id),
          last_message_at timestamp DEFAULT now(),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: T20 author_editor_conversations failed:', (e as Error).message);
        migrationErrors++;
      }
    }
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS author_editor_messages (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id varchar NOT NULL REFERENCES author_editor_conversations(id),
          sender_id varchar NOT NULL REFERENCES users(id),
          sender_role text NOT NULL DEFAULT 'author',
          body text NOT NULL,
          is_read boolean NOT NULL DEFAULT false,
          created_at timestamp DEFAULT now()
        )
      `);
    } catch (e) {
      if (!isBenignMigrationError(e)) {
        console.error('[MIGRATION CRITICAL]: T20 author_editor_messages failed:', (e as Error).message);
        migrationErrors++;
      }
    }

        // T19: Final migration summary
    if (migrationErrors > 0) {
      console.error(
        `[MIGRATION] ${migrationErrors} critical error(s) occurred during migrations — check logs above. ` +
        `Server continuing but some features may be broken.`
      );
    } else {
      console.log("[MIGRATION] All migrations completed successfully — 0 errors.");
    }
  } catch (error) {
    console.error("[MIGRATION] Unexpected top-level error:", error);
    throw error;
  }
}
