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
-- Utenti - API Key authentication (PR #43)
-- Colonne richieste da Payload CMS con useAPIKey: true
-- ===========================================
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS enable_a_p_i_key BOOLEAN;
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS api_key VARCHAR;
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS api_key_index VARCHAR;
CREATE INDEX IF NOT EXISTS utenti_api_key_idx ON utenti USING btree (api_key_index);

-- ===========================================
-- Swap livelli razionalità 5↔6 (idempotente)
-- Livello 5 "Giudizi di valore" → numero 6
-- Livello 6 "Istituzioni" → numero 5
-- ===========================================
DO $$
DECLARE
  v_level5_id integer;
  v_level6_id integer;
  v_level5_nome varchar;
BEGIN
  SELECT lr.id, lr.nome INTO v_level5_id, v_level5_nome
  FROM livelli_razionalita lr
  JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
  WHERE lr.numero = 5 AND lrr.lemmari_id = 1;

  IF v_level5_nome = 'Giudizi di valore' THEN
    SELECT lr.id INTO v_level6_id
    FROM livelli_razionalita lr
    JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
    WHERE lr.numero = 6 AND lrr.lemmari_id = 1;

    UPDATE livelli_razionalita SET numero = 99 WHERE id = v_level5_id;
    UPDATE livelli_razionalita SET numero = 5 WHERE id = v_level6_id;
    UPDATE livelli_razionalita SET numero = 6 WHERE id = v_level5_id;

    RAISE NOTICE 'Livelli 5/6 scambiati: ID % (5->6), ID % (6->5)', v_level5_id, v_level6_id;
  ELSE
    RAISE NOTICE 'Swap livelli gia applicato (livello 5 = "%"), skip', v_level5_nome;
  END IF;
END $$;

-- ===========================================
-- Aggiornamenti futuri vanno aggiunti qui
-- ===========================================

-- Log completamento
DO $$
BEGIN
  RAISE NOTICE 'Schema updates applied successfully at %', NOW();
END $$;
