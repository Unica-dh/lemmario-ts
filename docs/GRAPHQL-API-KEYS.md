# GraphQL API e Autenticazione API Key

## Panoramica

Il Lemmario espone un'API GraphQL completa oltre all'API REST, entrambe autenticabili tramite API key. Le API key permettono a consumatori esterni (applicazioni web, script, servizi) di accedere ai dati del lemmario senza necessita' di login interattivo.

## Endpoint

| Ambiente | URL |
| --- | --- |
| Sviluppo | `http://localhost:3000/api/graphql` |
| Produzione | `https://glossari.dh.unica.it/api/graphql` |

Il GraphQL Playground e' disponibile in sviluppo navigando all'endpoint GraphQL nel browser. In produzione il playground e' disabilitato.

## Autenticazione

### Formato header

```
Authorization: utenti API-Key <LA_TUA_API_KEY>
```

### Come ottenere una API key

1. Richiedere al **super_admin** l'abilitazione della API key sul proprio account utente
2. Il super_admin spunta "Enable API Key" nel profilo utente dall'admin panel
3. Payload genera automaticamente una chiave unica
4. L'utente puo' visualizzare la propria API key dal proprio profilo admin (`/admin/collections/utenti/<id>`)
5. Copiare la chiave e usarla nell'header `Authorization` delle richieste

### Permessi

La API key eredita i permessi dell'utente associato:

- **Ruolo**: lettore, redattore, lemmario_admin, super_admin
- **Lemmari assegnati**: l'utente accede solo ai lemmari assegnati via UtentiRuoliLemmari
- I dati pubblici (`pubblicato: true`) sono accessibili anche senza autenticazione

### Revoca

Il super_admin puo' revocare l'accesso:

- Disabilitando il checkbox "Enable API Key" sull'utente
- Impostando `attivo: false` sull'utente (blocca anche login JWT)

## Esempi di Query GraphQL

### Elenco lemmi

```graphql
query {
  Lemmi(where: { pubblicato: { equals: true } }) {
    docs {
      id
      termine
      tipo
      slug
    }
    totalDocs
  }
}
```

### Lemma con definizioni e ricorrenze

```graphql
query LemmaDettaglio($slug: String!) {
  Lemmi(where: { slug: { equals: $slug } }) {
    docs {
      id
      termine
      tipo
      slug
      note_redazionali
    }
  }
}
```

### Fonti bibliografiche

```graphql
query {
  Fontis {
    docs {
      id
      shorthand_id
      titolo
      autore
      anno
      riferimento_completo
    }
    totalDocs
  }
}
```

### Esempio con curl

```bash
# Query autenticata
curl -g -X POST https://glossari.dh.unica.it/api/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: utenti API-Key <LA_TUA_API_KEY>" \
  -d '{"query": "{ Lemmi(where: { pubblicato: { equals: true } }) { docs { id termine tipo slug } totalDocs } }"}'

# Query pubblica (solo dati pubblicati)
curl -g -X POST https://glossari.dh.unica.it/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Lemmi(where: { pubblicato: { equals: true } }) { docs { id termine } } }"}'
```

### Esempio con JavaScript (fetch)

```javascript
const GRAPHQL_URL = 'https://glossari.dh.unica.it/api/graphql'
const API_KEY = 'la-tua-api-key'

const query = `
  query LemmiPubblicati($lemmarioId: JSON!) {
    Lemmi(where: {
      pubblicato: { equals: true }
      lemmario: { equals: $lemmarioId }
    }) {
      docs { id termine tipo slug }
      totalDocs
    }
  }
`

const response = await fetch(GRAPHQL_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `utenti API-Key ${API_KEY}`,
  },
  body: JSON.stringify({
    query,
    variables: { lemmarioId: 2 },
  }),
})

const { data } = await response.json()
console.log(data.Lemmi.docs)
```

## Limiti e Sicurezza

| Parametro | Valore | Descrizione |
| --- | --- | --- |
| Rate limit | 500 req/min | Per IP. Configurabile via `RATE_LIMIT_MAX` |
| maxComplexity | 1000 | Complessita' massima di una singola query GraphQL |
| maxDepth | 5 | Profondita' massima delle relazioni nelle query |
| Playground | Disabilitato in prod | Attivo solo in sviluppo (`NODE_ENV=development`) |

### Complessita' query

Ogni campo nella query ha un costo di complessita' (default: 1 per campo scalare, 10 per relazioni). Se una query supera il limite di 1000, viene rifiutata con un errore. Per query che richiedono molti dati annidati, suddividerle in richieste separate.

### Profondita'

La catena di relazioni piu' profonda nel modello dati e': `Lemma -> Definizione -> Ricorrenza -> Fonte` (profondita' 3-4). Il limite di 5 consente tutte le query ragionevoli bloccando query circolari o abusive.

## CORS per Applicazioni Browser

Le applicazioni frontend esterne che accedono all'API GraphQL dal browser devono avere la propria origine abilitata nel CORS. Contattare l'amministratore per aggiungere l'origine alla variabile d'ambiente `CORS_ALLOWED_ORIGINS`.

```bash
# Nel .env del server (origini separate da virgola)
CORS_ALLOWED_ORIGINS=https://app-esterna.example.com,https://altra-app.example.com
```

Le richieste server-to-server (Node.js, Python, script) non sono soggette a restrizioni CORS.

## Collections Disponibili

Le seguenti collections sono accessibili via GraphQL (nomi GraphQL tra parentesi):

| Collection | Query GraphQL | Accesso pubblico |
| --- | --- | --- |
| Lemmi | `Lemmi` | Si (pubblicato=true) |
| Definizioni | `Definizioni` | Si |
| Ricorrenze | `Ricorrenze` | Si |
| Fonti | `Fontis` | Si |
| VariantiGrafiche | `VariantiGrafiche` | Si |
| RiferimentiIncrociati | `RiferimentiIncrociati` | Si |
| LivelliRazionalita | `LivelliRazionalitas` | Si |
| Lemmari | `Lemmaris` | Si |
| ContenutiStatici | `ContenutiStaticis` | Si (pubblicato=true) |
| Utenti | `Utentis` | No (auth richiesta) |
| UtentiRuoliLemmari | `UtentiRuoliLemmaris` | No (auth richiesta) |
| StoricoModifiche | `StoricoModifiches` | No (auth richiesta) |

## Creazione Service Account

Per consumatori API automatizzati, creare un utente servizio dedicato:

```bash
cd packages/payload-cms
API_USER_EMAIL=api-service@lemmario.internal \
ADMIN_PASSWORD=password-sicura \
pnpm create-api-user
```

Lo script stampa la API key generata. Assegnare poi i lemmari necessari tramite l'admin UI (UtentiRuoliLemmari).
