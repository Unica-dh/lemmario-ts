-- apply-schema-updates.sql
-- Script SQL idempotente per aggiornare lo schema del database
-- Eseguito durante il deploy per garantire che tutte le colonne esistano
-- Ogni ALTER TABLE usa IF NOT EXISTS per essere sicuro

-- ===========================================
-- Lemmari - Campi SEO (PR #12)
-- ===========================================
ALTER TABLE lemmari ADD COLUMN IF NOT EXISTS seo_consenti_ai_crawler BOOLEAN DEFAULT true;
ALTER TABLE lemmari ADD COLUMN IF NOT EXISTS seo_meta_description VARCHAR;

-- ===========================================
-- ContenutiStatici - Campo ordine
-- ===========================================
ALTER TABLE contenuti_statici ADD COLUMN IF NOT EXISTS ordine NUMERIC DEFAULT 0;

-- ===========================================
-- Aggiornamenti futuri vanno aggiunti qui
-- ===========================================

-- Log completamento
DO $$
BEGIN
  RAISE NOTICE 'Schema updates applied successfully at %', NOW();
END $$;
