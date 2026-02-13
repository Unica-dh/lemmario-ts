# Sprint Setup - Nuovo Design UI

**Data setup:** 13 febbraio 2026  
**Epic:** [#29 - Nuovo Design UI Accademico-Tipografico](https://github.com/Unica-dh/lemmario-ts/issues/29)  
**Feature branch:** `feature/new-ui-design`

---

## 📋 GitHub Issues Create

| Sprint | Issue | Titolo | Label |
|--------|-------|--------|-------|
| **Epic** | [#29](https://github.com/Unica-dh/lemmario-ts/issues/29) | 🎨 Epic: Nuovo Design UI Accademico-Tipografico | - |
| **Sprint 1** | [#20](https://github.com/Unica-dh/lemmario-ts/issues/20) | Sprint 1.1: Design System Foundation | `sprint-1`, `design-system` |
| **Sprint 1** | [#21](https://github.com/Unica-dh/lemmario-ts/issues/21) | Sprint 1.2: Componenti Core UI | `sprint-1`, `components` |
| **Sprint 2** | [#19](https://github.com/Unica-dh/lemmario-ts/issues/19) | Sprint 2.1: Backend - Campo Foto Lemmari | `sprint-2`, `backend` |
| **Sprint 2** | [#27](https://github.com/Unica-dh/lemmario-ts/issues/27) | Sprint 2.2: Homepage - Griglia Lemmari | `sprint-2`, `homepage` |
| **Sprint 3** | [#24](https://github.com/Unica-dh/lemmario-ts/issues/24) | Sprint 3.1: Sidebar Alfabetica | `sprint-3`, `navigation` |
| **Sprint 3** | [#22](https://github.com/Unica-dh/lemmario-ts/issues/22) | Sprint 3.2: Pagina Glossario | `sprint-3`, `search` |
| **Sprint 4** | [#25](https://github.com/Unica-dh/lemmario-ts/issues/25) | Sprint 4: Pagina Dettaglio Lemma | `sprint-4`, `lemma-detail` |
| **Sprint 5** | [#26](https://github.com/Unica-dh/lemmario-ts/issues/26) | Sprint 5: Pagine Statiche + Bibliografia | `sprint-5`, `static-pages` |
| **Sprint 6** | [#28](https://github.com/Unica-dh/lemmario-ts/issues/28) | Sprint 6: Mobile + Accessibility | `sprint-6`, `mobile` |
| **Sprint 7** | [#23](https://github.com/Unica-dh/lemmario-ts/issues/23) | Sprint 7: QA & Deploy | `sprint-7`, `qa` |

---

## 🚀 Quick Start - Sprint 1

### Checklist Pre-Sprint

- [x] Piano implementazione completo ([PIANO_IMPLEMENTAZIONE_UI.md](./PIANO_IMPLEMENTAZIONE_UI.md))
- [x] Specifiche UI complete ([SPECIFICHE-UI.md](./SPECIFICHE-UI.md))
- [x] Mockup grafico disponibile ([Dettaglio glossario.png](./Dettaglio%20glossario.png))
- [x] GitHub issues create
- [x] Feature branch creato (`feature/new-ui-design`)
- [ ] Team briefing completato
- [ ] Development environment setup

### Sprint 1 - Obiettivi

**Durata:** 5 giorni (13-19 febbraio 2026)

**Deliverable:**
1. Design system completo (Tailwind config + CSS custom properties)
2. Font Cormorant Garamond integrato
3. Dark mode funzionante con toggle
4. Componenti core: InstitutionalBar, MainNav, Footer

**Issue da completare:**
- [ ] [#20 - Design System Foundation](https://github.com/Unica-dh/lemmario-ts/issues/20)
- [ ] [#21 - Componenti Core UI](https://github.com/Unica-dh/lemmario-ts/issues/21)

---

## 📁 File da Modificare - Sprint 1

### Design System (#20)

```
packages/frontend/
├── tailwind.config.js          ← Aggiornare palette colori
├── src/app/globals.css         ← CSS custom properties + dark mode
└── src/app/layout.tsx          ← Font loading + ThemeProvider
```

**Nuovi file da creare:**
```
packages/frontend/src/components/theme/
├── ThemeProvider.tsx           ← Context + localStorage
└── ThemeToggle.tsx             ← Toggle button component
```

### Componenti Core (#21)

**Nuovi file da creare:**
```
packages/frontend/src/components/
└── InstitutionalBar.tsx        ← Barra nera sticky top
```

**File da modificare:**
```
packages/frontend/src/components/
├── Header.tsx  → MainNav.tsx   ← Refactor completo
└── Footer.tsx                  ← Refactor layout 2 colonne
```

---

## 🔧 Setup Development Environment

### 1. Checkout Feature Branch

```bash
cd /home/ale/docker/lemmario_ts
git checkout feature/new-ui-design
git pull origin feature/new-ui-design
```

### 2. Install Dependencies (se necessario)

```bash
pnpm install
```

### 3. Start Development Servers

```bash
# Opzione A: Entrambi backend + frontend
pnpm dev

# Opzione B: Solo frontend (se backend già running)
pnpm dev:frontend
```

### 4. Verify Setup

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Design attuale visibile per confronto

---

## 📊 Progress Tracking

### Sprint 1 - Progress

**Issue #20 - Design System Foundation**
- [ ] Tailwind config aggiornato
- [ ] Globals CSS con custom properties
- [ ] Font Cormorant Garamond caricato
- [ ] ThemeProvider implementato
- [ ] ThemeToggle implementato
- [ ] Testing: Build passa, dark mode funziona

**Issue #21 - Componenti Core UI**
- [ ] InstitutionalBar creato
- [ ] MainNav refactored da Header
- [ ] Footer refactored (2 colonne)
- [ ] Layout integration completata
- [ ] Testing: Sticky nav, responsive footer

---

## 🎯 Definition of Done - Per Issue

Ogni issue deve soddisfare:

- [ ] Codice implementato secondo specifiche
- [ ] Testing checklist completata
- [ ] Code review approvata
- [ ] Commit pushed al feature branch
- [ ] Screenshot/video demo (se UI change)
- [ ] Documentazione aggiornata (se necessario)

---

## 📝 Daily Standup Template

### What I did yesterday
- Issue #X: Task completati
- Blockers risolti

### What I'm doing today
- Issue #Y: Task in progress
- Obiettivo: Completare X entro fine giornata

### Blockers
- Nessuno / [Descrizione blocker]

---

## 🔗 Link Utili

- [Epic #29](https://github.com/Unica-dh/lemmario-ts/issues/29)
- [Piano Implementazione](./PIANO_IMPLEMENTAZIONE_UI.md)
- [Specifiche UI](./SPECIFICHE-UI.md)
- [GitHub Project Board](https://github.com/Unica-dh/lemmario-ts/issues) (filtro: label `sprint-1`)
- [Mockup Figma/PNG](./Dettaglio%20glossario.png)

---

## ⚠️ Note Importanti

### Commit Convention

Usare prefissi issue number nei commit:
```bash
git commit -m "#20 Update Tailwind config with monochrome palette"
git commit -m "#21 Create InstitutionalBar component"
```

### Branch Strategy

- `main` - Branch principale
- `feature/new-ui-design` - Branch per tutto il progetto UI
- NO branch per singole issue (tutto su feature branch)
- PR finale a `main` dopo Sprint 7

### Review Process

- Self-review prima di push
- Testing locale prima di commit
- Peer review opzionale durante sprint
- Final review completa prima del merge a main

---

**Last Updated:** 13 febbraio 2026  
**Next Sprint Planning:** Dopo completamento Sprint 1 (19 febbraio 2026)
