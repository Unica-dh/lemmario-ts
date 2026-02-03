# Piano Verifica Accesso Backend Produzione

**Data**: 3 febbraio 2026  
**Servizio**: Payload CMS Backend  
**URL**: https://glossari.dh.unica.it/admin  
**Stato attuale**: Frontend funziona, /admin non accessibile

---

## 🎯 Obiettivo

Diagnosticare e risolvere il problema di accesso al pannello admin di Payload CMS in produzione.

---

## 📋 FASE 1: Verifica Routing Reverse Proxy

### Step 1.1: Test Raggiungibilità API Backend

**Da eseguire**: Sul server di produzione o da locale

```bash
# Test endpoint pubblico /api (dovrebbe essere gestito dal reverse proxy)
curl -v https://glossari.dh.unica.it/api/utenti/init

# Test endpoint /admin (dovrebbe servire HTML del pannello Payload)
curl -v https://glossari.dh.unica.it/admin

# Test endpoint interno diretto (solo dal server)
curl -v http://localhost:3000/api/utenti/init
curl -v http://localhost:3000/admin
```

**Output atteso**:
- `/api/utenti/init` pubblico → JSON 200 OK
- `/admin` pubblico → HTML 200 OK (pagina login Payload)
- Endpoint interni `localhost:3000` → Stesse risposte (verifica che Payload funzioni)

**Se fallisce**:
- ❌ 404 Not Found → Reverse proxy non instrada correttamente
- ❌ 502 Bad Gateway → Payload non risponde sulla porta 3000
- ❌ 503 Service Unavailable → Container Payload non attivo

### Step 1.2: Verifica Headers Forwarded

```bash
# Controlla che il reverse proxy passi gli header corretti
curl -v https://glossari.dh.unica.it/api/utenti/init 2>&1 | grep -i "x-forwarded"
```

**Output atteso**:
```
< X-Forwarded-For: <ip_client>
< X-Forwarded-Proto: https
```

**Se mancano**: Payload potrebbe generare URL http:// invece di https:// causando problemi CORS/redirect

---

## 📋 FASE 2: Verifica Stato Container Payload

### Step 2.1: Controlla Container Attivo

**Da eseguire**: Sul server di produzione

```bash
# Lista container
docker ps | grep lemmario

# Output atteso:
# lemmario_payload   Up X minutes   0.0.0.0:3000->3000/tcp
# lemmario_frontend  Up X minutes   0.0.0.0:3001->3000/tcp
# lemmario_db        Up X minutes   0.0.0.0:5432->5432/tcp
```

**Se fallisce**:
- ❌ Container non presente → Rebuild necessario
- ❌ Container in restart loop → Controllare logs (Step 2.2)

### Step 2.2: Controlla Logs Payload

```bash
# Logs ultimi 100 righe
docker logs --tail=100 lemmario_payload

# Logs in real-time (interrompi con Ctrl+C dopo 10 secondi)
docker logs -f lemmario_payload
```

**Cerca errori**:
- ❌ `Error: DATABASE_URI` → Variabile .env non caricata
- ❌ `Error: PAYLOAD_SECRET` → Secret mancante
- ❌ `ECONNREFUSED postgres:5432` → Database non raggiungibile
- ❌ `Port 3000 already in use` → Conflitto porte
- ✅ `Payload Admin URL: http://localhost:3000/admin` → Payload avviato correttamente

### Step 2.3: Verifica Payload Risponde Internamente

**Da eseguire**: Sul server

```bash
# Test diretto al container (bypass reverse proxy)
curl -v http://localhost:3000/admin

# Test API diretta
curl -v http://localhost:3000/api/utenti/init
```

**Se fallisce**: Problema nel container Payload, non nel reverse proxy

---

## 📋 FASE 3: Verifica Configurazione Payload

### Step 3.1: Controlla Variabili d'Ambiente nel Container

```bash
# Entra nel container
docker exec -it lemmario_payload sh

# Verifica variabili
echo "PAYLOAD_PUBLIC_SERVER_URL: $PAYLOAD_PUBLIC_SERVER_URL"
echo "DATABASE_URI: $DATABASE_URI"
echo "PAYLOAD_SECRET: $PAYLOAD_SECRET"
echo "NODE_ENV: $NODE_ENV"

# Esci
exit
```

**Output atteso**:
```
PAYLOAD_PUBLIC_SERVER_URL: https://glossari.dh.unica.it
DATABASE_URI: postgres://lemmario_user:***@postgres:5432/lemmario_db
PAYLOAD_SECRET: <stringa 32+ caratteri>
NODE_ENV: production
```

**Se PAYLOAD_PUBLIC_SERVER_URL è localhost o http://**:
- ❌ File `.env` non aggiornato o non montato correttamente
- ❌ Container non riavviato dopo modifica .env

### Step 3.2: Verifica Route Admin Configurata

```bash
# Nel container Payload
docker exec -it lemmario_payload sh

# Cerca il payload.config.ts compilato
cat /app/dist/payload.config.js | grep -i "admin\|serverURL"
```

**Output atteso**:
```javascript
serverURL: "https://glossari.dh.unica.it"
admin: { bundler: ... }
```

---

## 📋 FASE 4: Verifica Database e Migrazioni

### Step 4.1: Controlla Tabelle Database Esistono

```bash
# Accedi a PostgreSQL
docker exec -it lemmario_db psql -U lemmario_user -d lemmario_db

# Lista tabelle
\dt

# Cerca tabella 'utenti'
SELECT COUNT(*) FROM utenti;

# Esci
\q
```

**Output atteso**:
- Lista di ~13-15 tabelle (utenti, lemmari, lemmi, fonti, ecc.)
- Tabella `utenti` con almeno 1 record (admin)

**Se fallisce**:
- ❌ "relation does not exist" → Migrazioni NON eseguite
- ❌ Tabelle vuote → Seed NON eseguito

### Step 4.2: Esegui Migrazioni (se mancano tabelle)

```bash
# Sul server
cd /home/dhruby/lemmario-ts

# Esegui migrazioni
docker exec lemmario_payload pnpm db:migrate

# Output atteso: lista di migrazioni eseguite
```

### Step 4.3: Esegui Seed Utente Admin (se tabella vuota)

```bash
# Crea utente admin
docker exec lemmario_payload pnpm db:seed

# Output atteso:
# ✅ Utente admin creato (email: admin@lemmario.dev, password: password)
# ✅ Lemmario creato
# ✅ Livelli razionalità creati
```

**Credenziali default**:
- Email: `admin@lemmario.dev`
- Password: `password`

---

## 📋 FASE 5: Test Accesso Admin da Browser

### Step 5.1: Apri Pannello Admin

**URL**: https://glossari.dh.unica.it/admin

**Cosa cercare**:
1. ✅ Pagina di login Payload carica (no spinner infinito)
2. ✅ Form con campi email/password
3. ✅ Logo/branding Payload CMS

**Se fallisce**:
- ❌ Spinner infinito → JavaScript non riesce a chiamare `/api/utenti/me`
- ❌ Pagina bianca → Errore JavaScript (apri Console DevTools)
- ❌ 404 Not Found → Reverse proxy non instrada `/admin`

### Step 5.2: Controlla Console Browser (DevTools)

Apri DevTools (F12) → Tab Console

**Cerca errori**:
- ❌ `CORS policy` → Headers non configurati correttamente
- ❌ `Mixed Content` → Payload serve http:// invece di https://
- ❌ `Failed to fetch` → API non raggiungibile
- ❌ `401 Unauthorized` → Normale su /admin se non loggato

### Step 5.3: Controlla Network Tab (DevTools)

Apri DevTools → Tab Network → Ricarica pagina

**Verifica requests**:
1. `GET /admin` → 200 OK (HTML)
2. `GET /api/utenti/init` → 200 OK (JSON)
3. `GET /api/utenti/me` → 401 Unauthorized (OK se non autenticato)

**Se `/api/utenti/me` chiama `localhost`**:
- ❌ Frontend ha variabile `NEXT_PUBLIC_API_URL` sbagliata
- ❌ Payload ha `serverURL` configurato male

### Step 5.4: Tenta Login

**Credenziali**:
- Email: `admin@lemmario.dev`
- Password: `password`

**POST request attesa**:
```
POST /api/utenti/login
Status: 200 OK
Response: { user: {...}, token: "..." }
```

**Se fallisce**:
- ❌ 401 → Credenziali sbagliate o utente non esiste
- ❌ 500 → Errore server (controlla logs Payload)
- ❌ 404 → Route `/api/utenti/login` non trovata (reverse proxy?)

---

## 📋 FASE 6: Risoluzione Problemi Comuni

### Problema: Spinner Infinito su /admin

**Causa probabile**: Frontend chiama API su URL sbagliato

**Soluzione**:
```bash
# 1. Verifica .env
cat /home/dhruby/lemmario-ts/.env | grep PAYLOAD_PUBLIC_SERVER_URL

# Deve essere: https://glossari.dh.unica.it (NO localhost)

# 2. Rebuild container
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml down
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml up -d --build

# 3. Attendi 30 secondi
sleep 30
```

### Problema: 502 Bad Gateway su /admin

**Causa probabile**: Container Payload non risponde

**Soluzione**:
```bash
# Restart Payload
docker restart lemmario_payload

# Controlla logs
docker logs -f lemmario_payload
```

### Problema: CORS Errors nella Console

**Causa probabile**: `serverURL` o `cors` mal configurati in Payload

**Soluzione**:
```bash
# Verifica payload.config.ts ha CORS corretto
docker exec lemmario_payload cat /app/dist/payload.config.js | grep cors

# Deve includere: https://glossari.dh.unica.it
```

### Problema: Credenziali Admin Non Funzionano

**Causa probabile**: Utente non seedato

**Soluzione**:
```bash
# Verifica utente esiste
docker exec -it lemmario_db psql -U lemmario_user -d lemmario_db -c "SELECT email FROM utenti;"

# Se vuoto, seed
docker exec lemmario_payload pnpm db:seed
```

---

## ✅ Checklist Finale

Dopo aver completato tutte le fasi, verifica:

- [ ] `curl https://glossari.dh.unica.it/admin` → 200 OK (HTML)
- [ ] `curl https://glossari.dh.unica.it/api/utenti/init` → 200 OK (JSON)
- [ ] `docker ps` → 3 container UP (payload, frontend, db)
- [ ] `docker logs lemmario_payload` → Nessun errore, "Payload Admin URL" visibile
- [ ] Database ha tabella `utenti` con almeno 1 record
- [ ] Browser su `/admin` → Form di login visibile (no spinner)
- [ ] Login con `admin@lemmario.dev` / `password` → Accesso riuscito

---

## 📊 Risultato Atteso

**URL funzionanti**:
- ✅ https://glossari.dh.unica.it → Homepage frontend Next.js
- ✅ https://glossari.dh.unica.it/admin → Pannello Payload CMS
- ✅ https://glossari.dh.unica.it/api/* → API REST Payload

**Container sani**:
```
lemmario_payload    Up 5 minutes   0.0.0.0:3000->3000/tcp
lemmario_frontend   Up 5 minutes   0.0.0.0:3001->3000/tcp
lemmario_db         Up 5 minutes   0.0.0.0:5432->5432/tcp
```

**Logs puliti**:
```
[Payload] Payload Admin URL: http://localhost:3000/admin
[Payload] API: http://localhost:3000/api
[Payload] Listening on port 3000
```
