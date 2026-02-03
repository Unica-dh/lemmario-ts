# Piano di Ottimizzazione Deploy

**Data**: 2026-02-03
**Obiettivo**: Ridurre il tempo di deploy da ~12-18 minuti a ~7-11 minuti

## Analisi Stato Attuale

### Flusso di Deploy Corrente

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CI Workflow (~4-6 min)                                                  │
│ Checkout → pnpm setup → Install deps → Lint → Typecheck → Build        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ CD Workflow - Build (~5-8 min) ❌ SEQUENZIALE                           │
│ Setup Buildx → Build Payload (~3-4 min) → Build Frontend (~2-3 min)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ CD Workflow - Deploy (~3-4 min)                                         │
│ Clone repo → Copy script → Pull images → Health Checks (max 2min)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Problemi Identificati

| # | Problema | Impatto | Tempo Perso |
|---|----------|---------|-------------|
| 1 | Build Docker sequenziali | ALTO | ~3-4 min |
| 2 | CI build non riutilizzato | MEDIO | ~2-3 min |
| 3 | pnpm installato 4 volte nei Dockerfile | MEDIO | ~1-2 min |
| 4 | Layer caching Dockerfile non ottimale | MEDIO | ~1 min |
| 5 | Pull images sequenziale nello script | BASSO | ~30s |
| 6 | Health checks troppo conservativi | BASSO | ~1 min avg |

## Piano di Implementazione

### Fase 1: Build Parallelo (Priorità ALTA)

**Risparmio stimato**: ~3-4 minuti

**Modifica**: Separare il job `build-and-push` in due job paralleli.

**File**: `.github/workflows/deploy.yml`

```yaml
jobs:
  build-payload:
    name: Build Payload image
    runs-on: ubuntu-latest
    outputs:
      commit_sha: ${{ steps.vars.outputs.sha_short }}
    steps:
      # Build solo Payload

  build-frontend:
    name: Build Frontend image
    runs-on: ubuntu-latest
    steps:
      # Build solo Frontend (parallelo a Payload)

  deploy:
    needs: [build-payload, build-frontend]
    # Aspetta entrambi prima di deployare
```

### Fase 2: Ottimizzazione Dockerfile (Priorità MEDIA)

**Risparmio stimato**: ~1-2 minuti

**Modifica**: Riordinare i layer per massimizzare il cache hit.

**Principio**: Copiare prima i file che cambiano raramente (lockfile), poi quelli che cambiano spesso (codice).

```dockerfile
# PRIMA: file di dipendenze (cambiano raramente)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/payload-cms/package.json ./packages/payload-cms/
RUN pnpm install --frozen-lockfile

# DOPO: codice sorgente (cambia spesso)
COPY packages/payload-cms ./packages/payload-cms
RUN pnpm build
```

### Fase 3: Ottimizzazione Deploy Script (Priorità BASSA)

**Risparmio stimato**: ~1 minuto

**Modifiche**:
1. Pull immagini in parallelo con `&` e `wait`
2. Health checks più aggressivi all'inizio

```bash
# Pull parallelo
docker pull "$REGISTRY/payload:$SHA" &
docker pull "$REGISTRY/frontend:$SHA" &
wait

# Health checks: 6 tentativi rapidi (2s), poi 10 lenti (5s)
```

## Confronto Tempi Attesi

| Fase | Attuale | Dopo Ottimizzazione |
|------|---------|---------------------|
| CI | 4-6 min | 4-6 min |
| Build Docker | 5-8 min | **2-4 min** |
| Deploy | 3-4 min | **2-3 min** |
| **Totale** | **12-18 min** | **8-13 min** |

## Implementazione

### Modifiche ai File

1. **`.github/workflows/deploy.yml`**
   - Separare build in job paralleli
   - Mantenere deploy come job dipendente

2. **`packages/payload-cms/Dockerfile`**
   - Riordinare COPY per cache optimization

3. **`packages/frontend/Dockerfile`**
   - Riordinare COPY per cache optimization

4. **`scripts/deploy/deploy-lemmario.sh`**
   - Parallelizzare pull images
   - Ottimizzare health checks

### Verifica

1. Push su branch `main`
2. Monitorare GitHub Actions
3. Verificare tempi di esecuzione
4. Confermare deploy su server VPN

## Rollback

In caso di problemi:
- Il workflow precedente è nel git history
- Le immagini Docker precedenti sono su GHCR con tag `sha-*`
- Lo script di deploy ha rollback automatico

## Note

- Le ottimizzazioni sono incrementali e possono essere applicate separatamente
- La Fase 1 (build parallelo) offre il miglior rapporto costo/beneficio
- Future ottimizzazioni potrebbero includere il riutilizzo degli artifact CI
