# Generate CLAUDE.md

Template standardizzato per generare CLAUDE.md in qualsiasi progetto. Evita di ricreare da zero ogni volta.

---

## Quando Usare

Usa questa skill (`/generate-claude-md`) quando:
- Inizi a lavorare su un nuovo progetto senza CLAUDE.md
- Vuoi rigenerare il CLAUDE.md dopo modifiche architetturali significative
- Vuoi verificare che il CLAUDE.md sia aggiornato

---

## Procedura

### Step 1: Analisi Codebase

Esplora il progetto e raccogli informazioni su:

1. **Struttura directory** - `ls -la`, `find . -type f -name '*.ts' | head -50`
2. **Package manager e dipendenze** - `package.json`, `pnpm-workspace.yaml`, `go.mod`, etc.
3. **Entry points** - file principali di ogni package/servizio
4. **Configurazione** - `.env.example`, `docker-compose.yml`, CI/CD files
5. **Test** - framework di test, directory test, configurazione
6. **Documentazione esistente** - README.md, docs/, commenti nei file

### Step 2: Genera CLAUDE.md

Segui questa struttura obbligatoria:

```markdown
# CLAUDE.md

## Project Overview
[Un paragrafo che descrive cosa fa il progetto, il dominio, e l'obiettivo principale]

## Architecture
[Stack tecnologico, struttura directory con descrizioni, pattern architetturali usati]

## Key Commands
[Comandi REALI testati - dev, build, test, deploy, lint, typecheck. MAI placeholder generici]

## Data Model
[Entita principali, relazioni, campi critici]

## Development Conventions
[Code style, naming conventions, pattern da seguire]

## Operational Guardrails
[Regole specifiche per evitare errori ricorrenti - derivate dall'esperienza]

## Environment Variables
[Lista variabili richieste con descrizione]

## Troubleshooting
[Problemi comuni e soluzioni]

## CI/CD
[Pipeline, workflow, deployment]

## Documentation
[Link a docs rilevanti nel repo]
```

### Step 3: Validazione

Verifica che:
- [ ] Tutti i comandi siano reali e funzionanti (non placeholder)
- [ ] I percorsi file siano corretti
- [ ] Le variabili d'ambiente corrispondano a `.env.example`
- [ ] La struttura directory sia aggiornata
- [ ] I troubleshooting tips coprano problemi reali incontrati

---

## Anti-Pattern da Evitare

- **NON** usare comandi generici come `npm start` se il progetto usa `pnpm dev`
- **NON** descrivere funzionalita non ancora implementate come se lo fossero
- **NON** omettere le Operational Guardrails - sono la sezione piu utile
- **NON** copiare README.md — CLAUDE.md e per Claude, non per umani
