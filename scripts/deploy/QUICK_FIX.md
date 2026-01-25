# ⚡ Fix Rapido Errore Produzione - AGGIORNATO

## Problema Risolto
```
✅ Version unsupported - RISOLTO
✅ Invalid interpolation format - RISOLTO  
✅ DB_USER variable not set - RISOLTO
✅ depends_on invalid type - RISOLTO
```

## Soluzione Finale (3 step)

### 1️⃣ SSH sul server e pull nuova versione

```bash
ssh dhomeka@90.147.144.145
cd ~/lemmario-ts
git pull origin main
```

### 2️⃣ Verifica file .env (dovrebbe essere già corretto)

```bash
cat .env
```

Dovrebbe contenere:
```bash
DB_USER=lemmario_user
DB_PASSWORD=TuaPasswordSicura123!
DB_NAME=lemmario_db
DB_HOST=postgres
DB_PORT=5432
PAYLOAD_SECRET=lemmario-payload-secret-production-2026-min-32-chars-required
PAYLOAD_PUBLIC_SERVER_URL=http://90.147.144.145:3000
NEXT_PUBLIC_API_URL=http://90.147.144.145:3000/api
NEXT_PUBLIC_SITE_URL=http://90.147.144.145:3001
NODE_ENV=production
```

Se manca qualcosa, ricrea il file:
```bash
cat > .env << 'ENVEOF'
DB_USER=lemmario_user
DB_PASSWORD=TuaPasswordSicura123!
DB_NAME=lemmario_db
DB_HOST=postgres
DB_PORT=5432
PAYLOAD_SECRET=lemmario-payload-secret-production-2026-min-32-chars-required
PAYLOAD_PUBLIC_SERVER_URL=http://90.147.144.145:3000
NEXT_PUBLIC_API_URL=http://90.147.144.145:3000/api
NEXT_PUBLIC_SITE_URL=http://90.147.144.145:3001
NODE_ENV=production
ENVEOF
```

### 3️⃣ Avvia servizi (QUESTO RICHIEDERÀ 5-10 MINUTI per buildare)

```bash
cd ~/lemmario-ts

# Avvia in background
docker-compose up --build -d

# Monitora il progresso (opzionale)
docker-compose logs -f
```

**IMPORTANTE**: Il primo build richiede tempo perché deve:
1. Scaricare le immagini base Docker (node:20-alpine, postgres:16-alpine)
2. Installare tutte le dipendenze pnpm (~1000 pacchetti)
3. Buildare il frontend Next.js

## Verifica Deployment

Dopo 5-10 minuti, verifica che i servizi siano attivi:

```bash
docker-compose ps
```

Dovresti vedere:
```
Name                      Command              State         Ports
----------------------------------------------------------------------
lemmario_db           docker-entrypoint.sh...    Up      5432/tcp
lemmario_frontend     pnpm start                 Up      0.0.0.0:3001->3000/tcp
lemmario_payload      pnpm dev                   Up      0.0.0.0:3000->3000/tcp
```

Test endpoints:
```bash
curl http://localhost:3000/api    # Dovrebbe rispondere con JSON
curl http://localhost:3001         # Dovrebbe rispondere con HTML
```

## Troubleshooting

### Build molto lento
Normale al primo avvio. `pnpm install` scarica ~1GB di dipendenze.

### Container in crash loop
```bash
# Verifica logs
docker-compose logs payload
docker-compose logs frontend

# Restart
docker-compose restart
```

### Porta già in uso
```bash
# Verifica porte occupate
ss -tlnp | grep -E '3000|3001|5432'

# Stop container conflittuali se necessario
docker stop <container_id>
```

### Reset completo (se necessario)
```bash
docker-compose down -v
docker-compose up --build -d
```

---

📖 **Guida completa**: [SETUP_SERVER.md](SETUP_SERVER.md)
