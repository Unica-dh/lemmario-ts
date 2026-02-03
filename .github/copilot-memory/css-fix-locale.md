# Fix CSS rotto in locale ✅ RISOLTO

## Problema
CSS funzionante in produzione ma rotto in locale - classi Tailwind non applicate.

## Causa identificata
**Mount Docker errati**: Il `docker-compose.dev.yml` montava file con estensioni errate (`.ts`/`.mjs`) che non esistevano. Docker creava DIRECTORY invece di montare i file `.js` reali, impedendo a TailwindCSS/PostCSS di funzionare.

## Soluzione applicata (3 feb 2026)

### 1. Correzione mount Docker
In [docker-compose.dev.yml](../docker-compose.dev.yml), servizio `frontend`:
```yaml
volumes:
  # PRIMA (ERRATO):
  - ./packages/frontend/tailwind.config.ts:/workspace/packages/frontend/tailwind.config.ts
  - ./packages/frontend/postcss.config.mjs:/workspace/packages/frontend/postcss.config.mjs
  
  # DOPO (CORRETTO):
  - ./packages/frontend/tailwind.config.js:/workspace/packages/frontend/tailwind.config.js
  - ./packages/frontend/postcss.config.js:/workspace/packages/frontend/postcss.config.js
```

### 2. Riavvio completo container
```bash
# Down per rimuovere le directory errate create da Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Up per ricreare con mount corretti
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Pulizia locale (opzionale)
```bash
cd packages/frontend
sudo rm -rf .next  # Rimuove build cache
```

## Verifica con Playwright
✅ Test visivo confermato - CSS Tailwind ora funziona:
- Header stilizzato correttamente (logo blu, menu allineato)
- Footer a 3 colonne ben strutturato
- Classi utility Tailwind applicate
- Variabili CSS `--tw-*` presenti nel bundle

## File modificati
- [docker-compose.dev.yml](../docker-compose.dev.yml): Corretti mount da `.ts`/`.mjs` a `.js`

## Nota tecnica
Quando Docker monta un file che non esiste sull'host, crea automaticamente una DIRECTORY con quel nome nel container, causando il fallimento silenzioso del caricamento della configurazione.
