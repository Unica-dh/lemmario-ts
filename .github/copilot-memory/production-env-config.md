# Configurazione .env di Produzione

**Data**: 3 febbraio 2026  
**Server**: glossari.dh.unica.it  
**Stato**: ✅ VERIFICATO E FUNZIONANTE

## Runner GitHub Actions
- **Label corretti**: `[self-hosted, vpn]` (NON usare `Linux, X64`)
- **Fix applicato**: 2026-02-03 - Corretto deploy.yml da `[self-hosted, Linux, X64]` a `[self-hosted, vpn]`

## File .env Produzione

```env
# Database Configuration
DB_USER=lemmario_user
DB_PASSWORD=lemmario_dev_password_2026
DB_NAME=lemmario_db
DB_HOST=postgres
DB_PORT=5432
DATABASE_URI=postgres://lemmario_user:lemmario_dev_password_2026@postgres:5432/lemmario_db

# Payload CMS Configuration
PAYLOAD_SECRET=lemmario_payload_secret_development_min_32_chars_20260102
PAYLOAD_PUBLIC_SERVER_URL=https://glossari.dh.unica.it

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://glossari.dh.unica.it/api
NEXT_PUBLIC_SITE_URL=https://glossari.dh.unica.it

# Environment
NODE_ENV=production
PORT=3000
```

## Note Importanti

### URLs Corretti
- **Backend pubblico**: `https://glossari.dh.unica.it` (porta 443 default HTTPS)
- **API endpoint**: `https://glossari.dh.unica.it/api`
- **Frontend pubblico**: `https://glossari.dh.unica.it` (porta standard HTTPS tramite reverse proxy)

### Differenze con Sviluppo Locale
- ❌ **NO `localhost`** negli URLs pubblici
- ✅ **HTTPS** invece di HTTP
- ✅ **NODE_ENV=production** invece di development
- ⚠️ **Porta frontend 3001** esplicitata nell'URL

### Problema Risolto
Il sito in produzione rimaneva bloccato su "Caricamento" perché il frontend tentava di chiamare `http://localhost:3000` invece dell'URL pubblico corretto.

**Root cause**: Variabili d'ambiente configurate con valori di sviluppo locale invece di produzione.

**Soluzione**: Aggiornato `.env` con URLs pubblici del dominio `glossari.dh.unica.it`.

## Azioni Post-Modifica

Dopo la modifica del `.env`, è necessario:

```bash
# Rebuild e restart dei container
cd /home/dhruby/lemmario-ts
docker compose down
docker compose up -d --build

# Oppure solo restart (se build già aggiornata)
docker compose restart payload frontend
```

## Location File

**Path sul server**: `/home/dhruby/lemmario-ts/.env`

**Backup consigliato**: 
```bash
cp /home/dhruby/lemmario-ts/.env /home/dhruby/backups/.env.production.$(date +%Y%m%d)
```
