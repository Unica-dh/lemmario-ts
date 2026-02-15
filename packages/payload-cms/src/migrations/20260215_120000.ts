import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Abilita autenticazione API key sulla collection Utenti.
 * Colonne richieste da Payload CMS con useAPIKey: true:
 * - enable_a_p_i_key: checkbox per abilitare API key sull'utente
 * - api_key: API key hashata
 * - api_key_index: hash per lookup efficiente delle API key
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "utenti" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean;
    ALTER TABLE "utenti" ADD COLUMN IF NOT EXISTS "api_key" varchar;
    ALTER TABLE "utenti" ADD COLUMN IF NOT EXISTS "api_key_index" varchar;
    CREATE INDEX IF NOT EXISTS "utenti_api_key_idx" ON "utenti" USING btree ("api_key_index");
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DROP INDEX IF EXISTS "utenti_api_key_idx";
    ALTER TABLE "utenti" DROP COLUMN IF EXISTS "api_key_index";
    ALTER TABLE "utenti" DROP COLUMN IF EXISTS "api_key";
    ALTER TABLE "utenti" DROP COLUMN IF EXISTS "enable_a_p_i_key";
  `)
}
