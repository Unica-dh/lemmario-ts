# Deploy Check

Checklist di validazione pre-deploy per prevenire errori ricorrenti nel ciclo CI/CD.

---

## Quando Usare

Usa questa skill (`/deploy-check`) quando:
- Stai per pushare su `main` e vuoi validare prima del deploy automatico
- Hai fixato problemi di deploy e vuoi verificare prima di ri-pushare
- Vuoi un controllo completo prima di un merge su main

---

## Checklist Pre-Deploy

Esegui questi step in ordine. **NON procedere** al push finché tutti i check non passano.

### Step 1: TypeScript Compilation

```bash
pnpm typecheck
```

Se fallisce: fix TUTTI gli errori TypeScript prima di proseguire. Non passare ad altro step.

### Step 2: ESLint

```bash
pnpm lint
```

Se fallisce: fix errori lint (attenzione a `react/no-unescaped-entities` - usare `&ldquo;`/`&rdquo;` in JSX).

### Step 3: Build Completa

```bash
pnpm build
```

Verifica che sia payload-cms che frontend compilino senza errori.

### Step 4: Docker Build Locale (opzionale ma consigliato)

```bash
docker compose build payload frontend
```

Verifica che i Dockerfile producano immagini valide.

### Step 5: Verifica Workflow Config

Controlla che:
- I tag GHCR usino **lowercase** per il repository owner
- Le label del runner nel workflow corrispondano a quelle configurate (`self-hosted, Linux, X64`)
- I percorsi remoti siano corretti (`/home/dhruby/lemmario-ts/` con trattino)

```bash
# Verifica tag GHCR nei workflow
grep -ri 'ghcr.io' .github/workflows/ | grep -v lowercase
```

### Step 6: Review Finale

```bash
# Verifica cosa sta per essere pushato
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
```

### Step 7: Push

Solo dopo che TUTTI i check passano:

```bash
git push origin main
```

---

## Troubleshooting Post-Push

Se il deploy fallisce dopo il push:

1. **Controlla i log**: `gh run view --log-failed`
2. **Categorizza l'errore**: TypeScript? Docker? Runner? Schema DB?
3. **Fix uno alla volta**: Non cercare di fixare tutto insieme
4. **Ri-esegui /deploy-check** dopo ogni fix
