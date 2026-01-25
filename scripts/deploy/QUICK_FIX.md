# ⚡ Fix Rapido Errore Produzione

## Problema
```
ERROR: Version in "./docker-compose.yml" is unsupported
WARNING: The DB_USER variable is not set
```

## Soluzione Rapida (3 step)

### 1️⃣ Pull nuova versione

```bash
ssh dhomeka@90.147.144.145
cd /home/dhomeka/lemmario_ts
git pull origin main
```

### 2️⃣ Crea file .env

```bash
cd /home/dhomeka/lemmario_ts
cp .env.production.example .env
nano .env
```

**Modifica questi valori:**
```bash
DB_PASSWORD=TuaPasswordSicura123!
PAYLOAD_SECRET=$(openssl rand -base64 32)  # o stringa random 32+ caratteri
PAYLOAD_PUBLIC_SERVER_URL=http://90.147.144.145:3000
NEXT_PUBLIC_API_URL=http://90.147.144.145:3000/api
NEXT_PUBLIC_SITE_URL=http://90.147.144.145:3001
```

Salva: `Ctrl+X` → `Y` → `Enter`

### 3️⃣ Avvia servizi

```bash
cd /home/dhomeka/lemmario_ts

# Se hai docker-compose v1 (vecchio)
docker-compose up -d

# Se hai docker compose v2 (nuovo)
docker compose up -d
```

## Verifica

```bash
docker ps
curl http://localhost:3000/api
curl http://localhost:3001
```

✅ **Fatto!** I prossimi deploy saranno automatici da GitHub Actions.

---

📖 **Guida completa**: [SETUP_SERVER.md](SETUP_SERVER.md)
