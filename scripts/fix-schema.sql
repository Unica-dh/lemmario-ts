-- Lemmario Schema Fix Script
-- Aggiunge colonne mancanti dopo le migrations di Payload
-- Eseguire DOPO che Payload ha creato le tabelle base
-- PostgreSQL 16

-- Fix definizioni_rels: aggiunge colonna per relazione livelli_razionalita
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'definizioni_rels' AND column_name = 'livelli_razionalita_id'
    ) THEN
        ALTER TABLE definizioni_rels ADD COLUMN livelli_razionalita_id INTEGER;
        CREATE INDEX IF NOT EXISTS definizioni_rels_livelli_razionalita_id_idx ON definizioni_rels(livelli_razionalita_id);
        RAISE NOTICE 'Added livelli_razionalita_id to definizioni_rels';
    ELSE
        RAISE NOTICE 'livelli_razionalita_id already exists in definizioni_rels';
    END IF;
END $$;

-- Fix ricorrenze: aggiunge colonne per campi strutturati
DO $$
BEGIN
    -- pagina_raw
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'pagina_raw') THEN
        ALTER TABLE ricorrenze ADD COLUMN pagina_raw VARCHAR;
        RAISE NOTICE 'Added pagina_raw to ricorrenze';
    END IF;

    -- tipo_riferimento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'tipo_riferimento') THEN
        ALTER TABLE ricorrenze ADD COLUMN tipo_riferimento VARCHAR;
        RAISE NOTICE 'Added tipo_riferimento to ricorrenze';
    END IF;

    -- numero
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'numero') THEN
        ALTER TABLE ricorrenze ADD COLUMN numero VARCHAR;
        RAISE NOTICE 'Added numero to ricorrenze';
    END IF;

    -- numero_secondario
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'numero_secondario') THEN
        ALTER TABLE ricorrenze ADD COLUMN numero_secondario VARCHAR;
        RAISE NOTICE 'Added numero_secondario to ricorrenze';
    END IF;

    -- rubrica_numero
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'rubrica_numero') THEN
        ALTER TABLE ricorrenze ADD COLUMN rubrica_numero VARCHAR;
        RAISE NOTICE 'Added rubrica_numero to ricorrenze';
    END IF;

    -- rubrica_titolo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'rubrica_titolo') THEN
        ALTER TABLE ricorrenze ADD COLUMN rubrica_titolo VARCHAR;
        RAISE NOTICE 'Added rubrica_titolo to ricorrenze';
    END IF;

    -- libro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'libro') THEN
        ALTER TABLE ricorrenze ADD COLUMN libro VARCHAR;
        RAISE NOTICE 'Added libro to ricorrenze';
    END IF;

    -- capitolo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'capitolo') THEN
        ALTER TABLE ricorrenze ADD COLUMN capitolo VARCHAR;
        RAISE NOTICE 'Added capitolo to ricorrenze';
    END IF;

    -- sezione
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'sezione') THEN
        ALTER TABLE ricorrenze ADD COLUMN sezione VARCHAR;
        RAISE NOTICE 'Added sezione to ricorrenze';
    END IF;

    -- supplemento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ricorrenze' AND column_name = 'supplemento') THEN
        ALTER TABLE ricorrenze ADD COLUMN supplemento VARCHAR;
        RAISE NOTICE 'Added supplemento to ricorrenze';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema fix completed successfully';
END $$;
