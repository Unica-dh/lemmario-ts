import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Aggiunge campo array loghi_partner alla collection Lemmari.
 * Permette di associare loghi di università/enti partner a ciascun lemmario.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    CREATE TABLE IF NOT EXISTS "lemmari_loghi_partner" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "alt" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "lemmari_loghi_partner_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" varchar NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_order_idx" ON "lemmari_loghi_partner" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_parent_id_idx" ON "lemmari_loghi_partner" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_rels_order_idx" ON "lemmari_loghi_partner_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_rels_parent_idx" ON "lemmari_loghi_partner_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_rels_path_idx" ON "lemmari_loghi_partner_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "lemmari_loghi_partner_rels_media_id_idx" ON "lemmari_loghi_partner_rels" USING btree ("media_id");

    DO $$ BEGIN
      ALTER TABLE "lemmari_loghi_partner" ADD CONSTRAINT "lemmari_loghi_partner_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "lemmari_loghi_partner_rels" ADD CONSTRAINT "lemmari_loghi_partner_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lemmari_loghi_partner"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "lemmari_loghi_partner_rels" ADD CONSTRAINT "lemmari_loghi_partner_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS "lemmari_loghi_partner_rels";
    DROP TABLE IF EXISTS "lemmari_loghi_partner";
  `)
}
