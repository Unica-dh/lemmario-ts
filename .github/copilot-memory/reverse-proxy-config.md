# Configurazione Reverse Proxy - Lemmario Produzione

## Architettura Attuale

**Dominio pubblico**: `https://glossari.dh.unica.it`

**Servizi interni Docker**:
- Payload CMS (backend): `localhost:3000`
- Next.js (frontend): `localhost:3001`
- PostgreSQL: `localhost:5432`

## Routing Richiesto

Il reverse proxy deve instradare le richieste così:

| Path pubblico | Servizio interno | Porta | Descrizione |
|---------------|------------------|-------|-------------|
| `/admin` | Payload CMS | 3000 | Pannello amministrazione |
| `/admin/*` | Payload CMS | 3000 | Tutte le route admin |
| `/api/*` | Payload CMS | 3000 | API REST del backend |
| `/*` | Next.js Frontend | 3001 | Tutte le altre route (frontend pubblico) |

## Configurazione Nginx (Esempio)

```nginx
server {
    listen 443 ssl http2;
    server_name glossari.dh.unica.it;

    # Certificati SSL (configurazione esistente)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Payload Admin Panel
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Payload API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js Frontend (default)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name glossari.dh.unica.it;
    return 301 https://$server_name$request_uri;
}
```

## Configurazione Caddy (Alternativa)

```caddy
glossari.dh.unica.it {
    # Payload Admin Panel
    handle /admin* {
        reverse_proxy localhost:3000
    }

    # Payload API
    handle /api/* {
        reverse_proxy localhost:3000
    }

    # Next.js Frontend (default)
    handle {
        reverse_proxy localhost:3001
    }
}
```

## Configurazione Traefik (Docker Labels)

Se usi Traefik, aggiungi al `docker-compose.yml`:

```yaml
services:
  payload:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.payload.rule=Host(`glossari.dh.unica.it`) && (PathPrefix(`/admin`) || PathPrefix(`/api`))"
      - "traefik.http.routers.payload.entrypoints=websecure"
      - "traefik.http.routers.payload.tls.certresolver=letsencrypt"
      - "traefik.http.services.payload.loadbalancer.server.port=3000"

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`glossari.dh.unica.it`)"
      - "traefik.http.routers.frontend.priority=1"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"
```

---

## 🤖 Prompt per AI Amministrazione Proxy

Usa questo prompt per far configurare il reverse proxy all'AI che gestisce il server:

```
Devo configurare il reverse proxy per l'applicazione Lemmario su https://glossari.dh.unica.it

ARCHITETTURA:
- 2 servizi Docker: Payload CMS (porta 3000) e Next.js Frontend (porta 3001)
- Dominio unico: glossari.dh.unica.it
- SSL/TLS già configurato

ROUTING RICHIESTO:
1. https://glossari.dh.unica.it/admin → Backend Payload porta 3000
2. https://glossari.dh.unica.it/admin/* → Backend Payload porta 3000  
3. https://glossari.dh.unica.it/api/* → Backend Payload porta 3000
4. https://glossari.dh.unica.it/* (tutto il resto) → Frontend Next.js porta 3001

PRIORITÀ:
- Le route /admin e /api devono avere priorità più alta
- La route / (default) deve catturare tutto ciò che non matcha /admin o /api

HEADERS NECESSARI:
- X-Forwarded-For
- X-Forwarded-Proto  
- X-Real-IP
- Host (preservare quello originale)
- Upgrade e Connection (per WebSocket se necessario)

Tipo di reverse proxy in uso: [INSERIRE: nginx/caddy/traefik/apache]

Genera la configurazione corretta per il reverse proxy, includendo:
1. Blocco server per HTTPS (porta 443)
2. Location blocks nell'ordine corretto di priorità
3. Redirect HTTP → HTTPS
4. Headers proxy necessari
5. Eventuali timeout/buffer settings raccomandati

Se usi Docker Compose con Traefik, fornisci i labels da aggiungere ai servizi.
```

---

## Verifica Configurazione

Dopo aver applicato la configurazione, testa:

```bash
# Test route admin
curl -I https://glossari.dh.unica.it/admin

# Test route API
curl -I https://glossari.dh.unica.it/api/utenti/init

# Test route frontend
curl -I https://glossari.dh.unica.it/

# Verifica headers forwarded
curl -v https://glossari.dh.unica.it/api/utenti/init 2>&1 | grep -i "x-forwarded"
```

Output atteso:
- `/admin` → 200 OK (HTML Payload)
- `/api/*` → 200 OK (JSON Payload)
- `/` → 200 OK (HTML Next.js)

## Troubleshooting

### Problema: Loop di redirect
**Causa**: Nginx location blocks fuori ordine  
**Soluzione**: Metti `/admin` e `/api` PRIMA di `/`

### Problema: 502 Bad Gateway
**Causa**: Servizi Docker non raggiungibili  
**Soluzione**: Verifica `docker ps` e che le porte 3000/3001 siano in ascolto

### Problema: CORS errors
**Causa**: Headers non forwardati correttamente  
**Soluzione**: Aggiungi `X-Forwarded-Proto` e `X-Forwarded-For`

### Problema: WebSocket disconnessioni
**Causa**: Upgrade header mancante  
**Soluzione**: Aggiungi:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
