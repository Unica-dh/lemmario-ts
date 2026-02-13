import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Sprint 2 - Backend: Media collection + Lemmari foto field
 *
 * 1. Creates `media` table for the new upload collection
 * 2. Creates `lemmari_rels` table for the foto upload relationship
 * 3. Adds `ordine` column to `contenuti_statici` (was in collection config but never migrated)
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    -- 1. Create media upload collection table
    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL,
      "alt" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric,
      "sizes_thumbnail_url" varchar,
      "sizes_thumbnail_width" numeric,
      "sizes_thumbnail_height" numeric,
      "sizes_thumbnail_mime_type" varchar,
      "sizes_thumbnail_filesize" numeric,
      "sizes_thumbnail_filename" varchar,
      "sizes_card_url" varchar,
      "sizes_card_width" numeric,
      "sizes_card_height" numeric,
      "sizes_card_mime_type" varchar,
      "sizes_card_filesize" numeric,
      "sizes_card_filename" varchar
    );

    -- 2. Create lemmari_rels table for foto upload relationship
    CREATE TABLE IF NOT EXISTS "lemmari_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    -- 3. Add ordine column to contenuti_statici (missing from initial migration)
    ALTER TABLE "contenuti_statici" ADD COLUMN IF NOT EXISTS "ordine" numeric DEFAULT 0;

    -- Indexes for media
    CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");

    -- Indexes for lemmari_rels
    CREATE INDEX IF NOT EXISTS "lemmari_rels_order_idx" ON "lemmari_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "lemmari_rels_parent_idx" ON "lemmari_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "lemmari_rels_path_idx" ON "lemmari_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "lemmari_rels_media_id_idx" ON "lemmari_rels" USING btree ("media_id");

    -- Foreign keys for lemmari_rels
    DO $$ BEGIN
      ALTER TABLE "lemmari_rels" ADD CONSTRAINT "lemmari_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "lemmari_rels" ADD CONSTRAINT "lemmari_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "contenuti_statici" DROP COLUMN IF EXISTS "ordine";
    DROP TABLE IF EXISTS "lemmari_rels";
    DROP TABLE IF EXISTS "media";
  `)
}
