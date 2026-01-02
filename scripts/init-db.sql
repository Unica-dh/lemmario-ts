-- Lemmario Database Initialization Script
-- PostgreSQL 16
-- Created: 2026-01-02

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Set timezone
SET timezone = 'Europe/Rome';

-- Create custom types for enums (will be managed by Payload, but defined here for clarity)
DO $$ BEGIN
    CREATE TYPE ruolo_utente AS ENUM ('super_admin', 'lemmario_admin', 'redattore', 'lettore');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_lemma AS ENUM ('latino', 'volgare');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_riferimento AS ENUM ('sinonimo', 'contrario', 'correlato', 'vedi_anche');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON DATABASE lemmario_db TO lemmario_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO lemmario_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lemmario_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lemmario_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO lemmario_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO lemmario_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_trgm';
    RAISE NOTICE 'Timezone set to: Europe/Rome';
END $$;
