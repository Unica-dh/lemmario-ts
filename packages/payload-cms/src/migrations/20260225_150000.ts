import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Aggiunge campo ordine alla collection Ricorrenze.
 * Permette di mantenere l'ordine progressivo delle citazioni
 * basato sulla posizione nel file HTML sorgente.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "ricorrenze" ADD COLUMN IF NOT EXISTS "ordine" numeric;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "ricorrenze" DROP COLUMN IF EXISTS "ordine";
  `)
}
