import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
await payload.db.drizzle.execute(sql`

DO $$ BEGIN
 CREATE TYPE "public"."enum_utenti_ruolo" AS ENUM('super_admin', 'lemmario_admin', 'redattore', 'lettore');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_utenti_ruoli_lemmari_ruolo" AS ENUM('lemmario_admin', 'redattore', 'lettore');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_lemmi_tipo" AS ENUM('latino', 'volgare');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_lemmi_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum__lemmi_v_version_tipo" AS ENUM('latino', 'volgare');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum__lemmi_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_riferimenti_incrociati_tipo" AS ENUM('sinonimo', 'contrario', 'correlato', 'vedi_anche');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "lemmari" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar NOT NULL,
	"titolo" varchar NOT NULL,
	"descrizione" varchar,
	"periodo_storico" varchar,
	"attivo" boolean,
	"ordine" numeric,
	"configurazione" jsonb,
	"data_pubblicazione" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "utenti" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"cognome" varchar NOT NULL,
	"ruolo" "enum_utenti_ruolo" NOT NULL,
	"attivo" boolean,
	"note" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp(3) with time zone,
	"salt" varchar,
	"hash" varchar,
	"login_attempts" numeric,
	"lock_until" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "utenti_ruoli_lemmari" (
	"id" serial PRIMARY KEY NOT NULL,
	"ruolo" "enum_utenti_ruoli_lemmari_ruolo" NOT NULL,
	"data_assegnazione" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "utenti_ruoli_lemmari_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"utenti_id" integer,
	"lemmari_id" integer
);

CREATE TABLE IF NOT EXISTS "lemmi" (
	"id" serial PRIMARY KEY NOT NULL,
	"termine" varchar,
	"tipo" "enum_lemmi_tipo",
	"slug" varchar,
	"ordinamento" varchar,
	"note_redazionali" varchar,
	"pubblicato" boolean,
	"data_pubblicazione" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_lemmi_status"
);

CREATE TABLE IF NOT EXISTS "lemmi_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmari_id" integer
);

CREATE TABLE IF NOT EXISTS "_lemmi_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_termine" varchar,
	"version_tipo" "enum__lemmi_v_version_tipo",
	"version_slug" varchar,
	"version_ordinamento" varchar,
	"version_note_redazionali" varchar,
	"version_pubblicato" boolean,
	"version_data_pubblicazione" timestamp(3) with time zone,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__lemmi_v_version_status",
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
);

CREATE TABLE IF NOT EXISTS "_lemmi_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmi_id" integer,
	"lemmari_id" integer
);

CREATE TABLE IF NOT EXISTS "varianti_grafiche" (
	"id" serial PRIMARY KEY NOT NULL,
	"variante" varchar NOT NULL,
	"priorita" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "varianti_grafiche_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmi_id" integer
);

CREATE TABLE IF NOT EXISTS "definizioni" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" numeric NOT NULL,
	"testo" jsonb NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "definizioni_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmi_id" integer
);

CREATE TABLE IF NOT EXISTS "fonti" (
	"id" serial PRIMARY KEY NOT NULL,
	"shorthand_id" varchar NOT NULL,
	"titolo" varchar NOT NULL,
	"autore" varchar,
	"anno" varchar,
	"riferimento_completo" varchar NOT NULL,
	"note" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ricorrenze" (
	"id" serial PRIMARY KEY NOT NULL,
	"testo_originale" jsonb NOT NULL,
	"pagina" varchar,
	"note" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ricorrenze_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"definizioni_id" integer,
	"fonti_id" integer,
	"livelli_razionalita_id" integer
);

CREATE TABLE IF NOT EXISTS "livelli_razionalita" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" numeric NOT NULL,
	"nome" varchar NOT NULL,
	"descrizione" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "livelli_razionalita_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmari_id" integer
);

CREATE TABLE IF NOT EXISTS "riferimenti_incrociati" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "enum_riferimenti_incrociati_tipo" NOT NULL,
	"bidirezionale" boolean,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "riferimenti_incrociati_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmi_id" integer
);

CREATE TABLE IF NOT EXISTS "contenuti_statici" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar NOT NULL,
	"titolo" varchar NOT NULL,
	"contenuto" jsonb NOT NULL,
	"pubblicato" boolean,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contenuti_statici_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"lemmari_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"utenti_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "utenti_ruoli_lemmari_rels" ADD CONSTRAINT "utenti_ruoli_lemmari_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."utenti_ruoli_lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "utenti_ruoli_lemmari_rels" ADD CONSTRAINT "utenti_ruoli_lemmari_rels_utenti_fk" FOREIGN KEY ("utenti_id") REFERENCES "public"."utenti"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "utenti_ruoli_lemmari_rels" ADD CONSTRAINT "utenti_ruoli_lemmari_rels_lemmari_fk" FOREIGN KEY ("lemmari_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lemmi_rels" ADD CONSTRAINT "lemmi_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lemmi"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lemmi_rels" ADD CONSTRAINT "lemmi_rels_lemmari_fk" FOREIGN KEY ("lemmari_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_lemmi_v_rels" ADD CONSTRAINT "_lemmi_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lemmi_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_lemmi_v_rels" ADD CONSTRAINT "_lemmi_v_rels_lemmi_fk" FOREIGN KEY ("lemmi_id") REFERENCES "public"."lemmi"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_lemmi_v_rels" ADD CONSTRAINT "_lemmi_v_rels_lemmari_fk" FOREIGN KEY ("lemmari_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "varianti_grafiche_rels" ADD CONSTRAINT "varianti_grafiche_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."varianti_grafiche"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "varianti_grafiche_rels" ADD CONSTRAINT "varianti_grafiche_rels_lemmi_fk" FOREIGN KEY ("lemmi_id") REFERENCES "public"."lemmi"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "definizioni_rels" ADD CONSTRAINT "definizioni_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."definizioni"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "definizioni_rels" ADD CONSTRAINT "definizioni_rels_lemmi_fk" FOREIGN KEY ("lemmi_id") REFERENCES "public"."lemmi"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ricorrenze_rels" ADD CONSTRAINT "ricorrenze_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ricorrenze"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ricorrenze_rels" ADD CONSTRAINT "ricorrenze_rels_definizioni_fk" FOREIGN KEY ("definizioni_id") REFERENCES "public"."definizioni"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ricorrenze_rels" ADD CONSTRAINT "ricorrenze_rels_fonti_fk" FOREIGN KEY ("fonti_id") REFERENCES "public"."fonti"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ricorrenze_rels" ADD CONSTRAINT "ricorrenze_rels_livelli_razionalita_fk" FOREIGN KEY ("livelli_razionalita_id") REFERENCES "public"."livelli_razionalita"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "livelli_razionalita_rels" ADD CONSTRAINT "livelli_razionalita_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."livelli_razionalita"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "livelli_razionalita_rels" ADD CONSTRAINT "livelli_razionalita_rels_lemmari_fk" FOREIGN KEY ("lemmari_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "riferimenti_incrociati_rels" ADD CONSTRAINT "riferimenti_incrociati_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."riferimenti_incrociati"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "riferimenti_incrociati_rels" ADD CONSTRAINT "riferimenti_incrociati_rels_lemmi_fk" FOREIGN KEY ("lemmi_id") REFERENCES "public"."lemmi"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contenuti_statici_rels" ADD CONSTRAINT "contenuti_statici_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contenuti_statici"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contenuti_statici_rels" ADD CONSTRAINT "contenuti_statici_rels_lemmari_fk" FOREIGN KEY ("lemmari_id") REFERENCES "public"."lemmari"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_utenti_fk" FOREIGN KEY ("utenti_id") REFERENCES "public"."utenti"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "lemmari_slug_idx" ON "lemmari" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "lemmari_created_at_idx" ON "lemmari" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "utenti_created_at_idx" ON "utenti" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "utenti_email_idx" ON "utenti" USING btree ("email");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_created_at_idx" ON "utenti_ruoli_lemmari" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_rels_order_idx" ON "utenti_ruoli_lemmari_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_rels_parent_idx" ON "utenti_ruoli_lemmari_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_rels_path_idx" ON "utenti_ruoli_lemmari_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_rels_utenti_id_idx" ON "utenti_ruoli_lemmari_rels" USING btree ("utenti_id");
CREATE INDEX IF NOT EXISTS "utenti_ruoli_lemmari_rels_lemmari_id_idx" ON "utenti_ruoli_lemmari_rels" USING btree ("lemmari_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lemmi_slug_idx" ON "lemmi" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "lemmi_created_at_idx" ON "lemmi" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "lemmi__status_idx" ON "lemmi" USING btree ("_status");
CREATE INDEX IF NOT EXISTS "lemmi_rels_order_idx" ON "lemmi_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "lemmi_rels_parent_idx" ON "lemmi_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "lemmi_rels_path_idx" ON "lemmi_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "lemmi_rels_lemmari_id_idx" ON "lemmi_rels" USING btree ("lemmari_id");
CREATE INDEX IF NOT EXISTS "_lemmi_v_version_version_slug_idx" ON "_lemmi_v" USING btree ("version_slug");
CREATE INDEX IF NOT EXISTS "_lemmi_v_version_version_created_at_idx" ON "_lemmi_v" USING btree ("version_created_at");
CREATE INDEX IF NOT EXISTS "_lemmi_v_version_version__status_idx" ON "_lemmi_v" USING btree ("version__status");
CREATE INDEX IF NOT EXISTS "_lemmi_v_created_at_idx" ON "_lemmi_v" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "_lemmi_v_updated_at_idx" ON "_lemmi_v" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "_lemmi_v_latest_idx" ON "_lemmi_v" USING btree ("latest");
CREATE INDEX IF NOT EXISTS "_lemmi_v_rels_order_idx" ON "_lemmi_v_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "_lemmi_v_rels_parent_idx" ON "_lemmi_v_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_lemmi_v_rels_path_idx" ON "_lemmi_v_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "_lemmi_v_rels_lemmi_id_idx" ON "_lemmi_v_rels" USING btree ("lemmi_id");
CREATE INDEX IF NOT EXISTS "_lemmi_v_rels_lemmari_id_idx" ON "_lemmi_v_rels" USING btree ("lemmari_id");
CREATE INDEX IF NOT EXISTS "varianti_grafiche_created_at_idx" ON "varianti_grafiche" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "varianti_grafiche_rels_order_idx" ON "varianti_grafiche_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "varianti_grafiche_rels_parent_idx" ON "varianti_grafiche_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "varianti_grafiche_rels_path_idx" ON "varianti_grafiche_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "varianti_grafiche_rels_lemmi_id_idx" ON "varianti_grafiche_rels" USING btree ("lemmi_id");
CREATE INDEX IF NOT EXISTS "definizioni_created_at_idx" ON "definizioni" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "definizioni_rels_order_idx" ON "definizioni_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "definizioni_rels_parent_idx" ON "definizioni_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "definizioni_rels_path_idx" ON "definizioni_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "definizioni_rels_lemmi_id_idx" ON "definizioni_rels" USING btree ("lemmi_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fonti_shorthand_id_idx" ON "fonti" USING btree ("shorthand_id");
CREATE INDEX IF NOT EXISTS "fonti_created_at_idx" ON "fonti" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "ricorrenze_created_at_idx" ON "ricorrenze" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_order_idx" ON "ricorrenze_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_parent_idx" ON "ricorrenze_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_path_idx" ON "ricorrenze_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_definizioni_id_idx" ON "ricorrenze_rels" USING btree ("definizioni_id");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_fonti_id_idx" ON "ricorrenze_rels" USING btree ("fonti_id");
CREATE INDEX IF NOT EXISTS "ricorrenze_rels_livelli_razionalita_id_idx" ON "ricorrenze_rels" USING btree ("livelli_razionalita_id");
CREATE INDEX IF NOT EXISTS "livelli_razionalita_created_at_idx" ON "livelli_razionalita" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "livelli_razionalita_rels_order_idx" ON "livelli_razionalita_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "livelli_razionalita_rels_parent_idx" ON "livelli_razionalita_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "livelli_razionalita_rels_path_idx" ON "livelli_razionalita_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "livelli_razionalita_rels_lemmari_id_idx" ON "livelli_razionalita_rels" USING btree ("lemmari_id");
CREATE INDEX IF NOT EXISTS "riferimenti_incrociati_created_at_idx" ON "riferimenti_incrociati" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "riferimenti_incrociati_rels_order_idx" ON "riferimenti_incrociati_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "riferimenti_incrociati_rels_parent_idx" ON "riferimenti_incrociati_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "riferimenti_incrociati_rels_path_idx" ON "riferimenti_incrociati_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "riferimenti_incrociati_rels_lemmi_id_idx" ON "riferimenti_incrociati_rels" USING btree ("lemmi_id");
CREATE UNIQUE INDEX IF NOT EXISTS "contenuti_statici_slug_idx" ON "contenuti_statici" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "contenuti_statici_created_at_idx" ON "contenuti_statici" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "contenuti_statici_rels_order_idx" ON "contenuti_statici_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "contenuti_statici_rels_parent_idx" ON "contenuti_statici_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "contenuti_statici_rels_path_idx" ON "contenuti_statici_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "contenuti_statici_rels_lemmari_id_idx" ON "contenuti_statici_rels" USING btree ("lemmari_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_utenti_id_idx" ON "payload_preferences_rels" USING btree ("utenti_id");
CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`);

}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
await payload.db.drizzle.execute(sql`

DROP TABLE "lemmari";
DROP TABLE "utenti";
DROP TABLE "utenti_ruoli_lemmari";
DROP TABLE "utenti_ruoli_lemmari_rels";
DROP TABLE "lemmi";
DROP TABLE "lemmi_rels";
DROP TABLE "_lemmi_v";
DROP TABLE "_lemmi_v_rels";
DROP TABLE "varianti_grafiche";
DROP TABLE "varianti_grafiche_rels";
DROP TABLE "definizioni";
DROP TABLE "definizioni_rels";
DROP TABLE "fonti";
DROP TABLE "ricorrenze";
DROP TABLE "ricorrenze_rels";
DROP TABLE "livelli_razionalita";
DROP TABLE "livelli_razionalita_rels";
DROP TABLE "riferimenti_incrociati";
DROP TABLE "riferimenti_incrociati_rels";
DROP TABLE "contenuti_statici";
DROP TABLE "contenuti_statici_rels";
DROP TABLE "payload_preferences";
DROP TABLE "payload_preferences_rels";
DROP TABLE "payload_migrations";`);

}
