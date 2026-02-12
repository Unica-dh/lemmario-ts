import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Allinea lo schema di riferimenti_incrociati alla collection config attuale.
 * La tabella e' vuota (0 righe), quindi non serve migrazione dati.
 *
 * Rimozioni: colonne tipo (enum), bidirezionale (boolean)
 * Aggiunte: tipo_riferimento (varchar), note (varchar), auto_creato (boolean)
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "riferimenti_incrociati" DROP COLUMN IF EXISTS "tipo";
    ALTER TABLE "riferimenti_incrociati" DROP COLUMN IF EXISTS "bidirezionale";
    ALTER TABLE "riferimenti_incrociati" ADD COLUMN "tipo_riferimento" varchar NOT NULL DEFAULT 'CFR';
    ALTER TABLE "riferimenti_incrociati" ADD COLUMN "note" varchar;
    ALTER TABLE "riferimenti_incrociati" ADD COLUMN "auto_creato" boolean DEFAULT false;
    DROP TYPE IF EXISTS "enum_riferimenti_incrociati_tipo";
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    CREATE TYPE "enum_riferimenti_incrociati_tipo" AS ENUM('sinonimo', 'contrario', 'correlato', 'vedi_anche');
    ALTER TABLE "riferimenti_incrociati" DROP COLUMN IF EXISTS "tipo_riferimento";
    ALTER TABLE "riferimenti_incrociati" DROP COLUMN IF EXISTS "note";
    ALTER TABLE "riferimenti_incrociati" DROP COLUMN IF EXISTS "auto_creato";
    ALTER TABLE "riferimenti_incrociati" ADD COLUMN "tipo" "enum_riferimenti_incrociati_tipo" NOT NULL DEFAULT 'correlato';
    ALTER TABLE "riferimenti_incrociati" ADD COLUMN "bidirezionale" boolean;
  `)
}
