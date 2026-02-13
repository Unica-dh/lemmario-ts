# Piano di Implementazione - Nuovo Design UI Frontend

**Data:** 13 febbraio 2026  
**Versione:** 1.0  
**Riferimenti:** 
- [SPECIFICHE-UI.md](./SPECIFICHE-UI.md)
- [Dettaglio glossario.png](./Dettaglio%20glossario.png)

---

## Indice

1. [Panoramica](#panoramica)
2. [Analisi Gap](#analisi-gap)
3. [Modifiche Backend](#modifiche-backend)
4. [Modifiche Frontend](#modifiche-frontend)
5. [Roadmap Implementazione](#roadmap-implementazione)
6. [Testing e QA](#testing-e-qa)
7. [Deploy](#deploy)

---

## Panoramica

### Obiettivo

Trasformare il frontend da un'estetica "web app SaaS" moderna (sky blue, card con bordi/ombre) a un design **accademico-tipografico** minimalista ispirato a pubblicazioni editoriali umanistiche (monocromatico nero/grigio/bianco, ampio uso di serif, maiuscoletto con letter-spacing).

### Principi Guida

- **Minimalismo accademico**: Riduzione elementi visivi superflui, focus su tipografia e whitespace
- **Mobile-first responsive**: Design adattabile da mobile a desktop
- **Accessibilità**: Dark mode nativo, contrasti WCAG AA, navigazione keyboard-friendly
- **Performance**: SSR/ISR con Next.js, code-splitting componenti, immagini ottimizzate
- **Manutenibilità**: Design system con CSS custom properties, componenti riutilizzabili

---

## Analisi Gap

### Differenze tra Design Attuale e Nuovo

| Aspetto | Attuale | Nuovo | Priorità |
|---------|---------|-------|----------|
| **Palette colori** | Sky blue (#0ea5e9) + grigi | Monocromatico nero/grigio/bianco | 🔴 Alta |
| **Font principale** | Merriweather (serif) | Cormorant Garamond (serif) | 🔴 Alta |
| **Dark mode** | Non implementato | Supporto completo con toggle | 🔴 Alta |
| **Header** | Sticky bianco + logo "Lemmario" | Barra nera istituzionale + nav sticky separata | 🔴 Alta |
| **Footer** | 3 colonne sfondo grigio | 2 colonne minimale su bianco | 🟡 Media |
| **Card style** | Bordi + ombre + padding generoso | Nessun bordo, hover subtle bg (#f5f5f5) | 🔴 Alta |
| **Badge tipo** | Pill colorate (bg-blue-100) | Testo grigio maiuscoletto, no bg | 🟡 Media |
| **Paginazione** | Bottoni standard Tailwind | Testo puro maiuscoletto con letter-spacing | 🟡 Media |
| **Sidebar alfabetica** | Non presente | Sticky verticale A-Z (drawer mobile) | 🔴 Alta |
| **Barra ricerca** | Campo con bordo pieno | Stile underline (solo bordo inferiore) | 🟡 Media |
| **Metadati card** | Solo badge tipo | "N DEF · N FONTI · N RICORRENZE" | 🟡 Media |
| **Homepage** | Lista lemmi default | Griglia card lemmari con foto | 🔴 Alta |
| **Lemmi per pagina** | 24 | 16 (8 righe × 2 col) | 🟡 Media |
| **Ricerca** | Solo termine | Termine + testo definizioni | 🔴 Alta |
| **Navigazione pagine** | Link semplici | Maiuscoletto con letter-spacing | 🟡 Media |

---

## Modifiche Backend

### 1. Collection Lemmari - Aggiungere Campo Foto

**File:** `packages/payload-cms/src/collections/Lemmari.ts`

**Modifica:** Aggiungere campo `foto` di tipo `upload` per l'immagine della card homepage.

```typescript
{
  name: 'foto',
  type: 'upload',
  relationTo: 'media', // Assumendo collection Media esistente
  admin: {
    description: 'Immagine rappresentativa del lemmario (visibile nella card homepage)',
    position: 'sidebar',
  },
}
```

**Note:**
- Verificare se esiste già una collection `media` o `uploads` in Payload
- Se non esiste, creare collection Media standard
- Dimensioni consigliate: 800×600px (aspect ratio 4:3)
- Formato: WebP/JPEG ottimizzato

**Testing:**
- Upload immagine in admin panel
- Verificare caricamento e thumbnail
- Query API restituisce URL immagine

---

### 2. API Ricerca Avanzata (Opzionale Backend)

**Attuale:** Ricerca solo su campo `termine` via filtro `like`.

**Nuovo:** Ricerca anche nel testo delle definizioni.

**Opzioni implementative:**

**A) Lato Client (Frontend)** - **CONSIGLIATO per MVP**
- Pro: No modifiche backend, implementazione più veloce
- Contro: Performance con grandi dataset (>500 lemmi), latenza fetch
- Strategia: Fetch tutti lemmi pubblicati del lemmario, filtro in memoria con `Array.filter()`

**B) Lato Server (Backend Payload)**
- Pro: Performance migliore, paginazione reale
- Contro: Complessità query Payload con relazioni nested
- Strategia: Query con relazione `definizioni` e filtro OR su `termine` + `definizioni.testo`

**Decisione MVP:** Opzione A (client-side) per semplicità. Considerare B se performance diventa bottleneck.

---

### 3. Endpoint Conteggio per Sidebar Alfabetica

**Obiettivo:** Determinare quali lettere A-Z hanno lemmi associati per disabilitare quelle vuote.

**Opzioni:**

**A) Query aggregata backend** - Nuovo endpoint custom:
```typescript
GET /api/lemmari/:id/lettere-disponibili
Response: { lettere: ['A', 'B', 'C', ...] }
```

**B) Calcolo client-side** - Fetch tutti lemmi, estrai prima lettera con `Set`:
```typescript
const lettereDisponibili = new Set(lemmi.map(l => l.termine[0].toUpperCase()))
```

**Decisione MVP:** Opzione B per semplicità. Cache risultato in sessionStorage.

---

## Modifiche Frontend

### Fase 1: Design System Foundation

#### 1.1 Tailwind Config - Nuova Palette

**File:** `packages/frontend/tailwind.config.js`

**Modifica completa sezione `theme.extend.colors`:**

```javascript
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [...],
  theme: {
    extend: {
      colors: {
        // Remove primary sky blue palette
        text: {
          DEFAULT: '#1a1a1a',        // Testo principale
          muted: '#6b6b6b',          // Metadati, label
          body: '#3a3a3a',           // Corpo definizioni
          inverse: '#ffffff',        // Testo header nero
          disabled: '#9a9a9a',       // Lettere sidebar non attive
        },
        bg: {
          DEFAULT: '#ffffff',        // Sfondo principale
          subtle: '#f5f5f5',         // Hover card, sezioni alternate
          inverse: '#1a1a1a',        // Barra istituzionale
        },
        border: {
          DEFAULT: '#d4d4d4',        // Linee divisorie
        },
        // Dark mode colors (applied via class)
        dark: {
          text: {
            DEFAULT: '#e8e8e8',
            body: '#c8c8c8',
            muted: '#8a8a8a',
            inverse: '#d0d0d0',
          },
          bg: {
            DEFAULT: '#121212',
            subtle: '#1e1e1e',
            inverse: '#0a0a0a',
          },
          border: {
            DEFAULT: '#333333',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest: '0.15em',  // Per maiuscoletto label
      },
      lineHeight: {
        relaxed: '1.6',    // Per testo definizioni
      },
    },
  },
  plugins: [],
}
```

**Testing:**
- Build Tailwind: `pnpm build`
- Verificare non ci siano classi rotte nel codice esistente

---

#### 1.2 Globals CSS - Custom Properties + Dark Mode

**File:** `packages/frontend/src/app/globals.css`

**Sostituire contenuto con:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Custom Properties per design system */
:root {
  /* Light mode (default) */
  --color-text: #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-text-body: #3a3a3a;
  --color-text-inverse: #ffffff;
  --color-text-disabled: #9a9a9a;
  
  --color-bg: #ffffff;
  --color-bg-subtle: #f5f5f5;
  --color-bg-inverse: #1a1a1a;
  
  --color-border: #d4d4d4;
}

/* Dark mode */
.dark {
  --color-text: #e8e8e8;
  --color-text-muted: #8a8a8a;
  --color-text-body: #c8c8c8;
  --color-text-inverse: #d0d0d0;
  --color-text-disabled: #5a5a5a;
  
  --color-bg: #121212;
  --color-bg-subtle: #1e1e1e;
  --color-bg-inverse: #0a0a0a;
  
  --color-border: #333333;
}

/* Prefers-color-scheme fallback */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-text: #e8e8e8;
    --color-text-muted: #8a8a8a;
    --color-text-body: #c8c8c8;
    --color-text-inverse: #d0d0d0;
    --color-text-disabled: #5a5a5a;
    
    --color-bg: #121212;
    --color-bg-subtle: #1e1e1e;
    --color-bg-inverse: #0a0a0a;
    
    --color-border: #333333;
  }
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-body);
}

/* Utility classes per design system */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  /* Maiuscoletto con letter-spacing */
  .label-uppercase {
    font-size: 0.6875rem; /* 11px */
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-family: var(--font-sans);
  }
  
  /* Stile link clean */
  .link-clean {
    text-decoration: none;
    transition: color 200ms ease;
  }
  
  .link-clean:hover {
    color: var(--color-text);
  }
}

/* Fix font loading */
@layer base {
  html {
    font-family: Inter, system-ui, sans-serif;
  }
}
```

**Testing:**
- Verificare rendering variabili CSS in browser DevTools
- Toggle dark mode manualmente con classe `dark` su `<html>`

---

#### 1.3 Layout Root - Font Loading + Dark Mode Provider

**File:** `packages/frontend/src/app/layout.tsx`

**Modifiche:**

```tsx
import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme/ThemeProvider' // Nuovo componente
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

// ... metadata esistente ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </ThemeProvider>
        
        {/* Script esistenti (Google Analytics, etc.) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-..."
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

**Note:**
- `suppressHydrationWarning`: Evita warning per classe `dark` applicata via JS
- Font variables: Accessibili in Tailwind come `font-sans` e `font-serif`

---

### Fase 2: Componenti Core UI

#### 2.1 Theme Provider + Toggle

**File (nuovo):** `packages/frontend/src/components/theme/ThemeProvider.tsx`

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      setResolvedTheme('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
      setResolvedTheme('light')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        root.classList.add('dark')
        setResolvedTheme('dark')
      } else {
        root.classList.remove('dark')
        setResolvedTheme('light')
      }
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

**File (nuovo):** `packages/frontend/src/components/theme/ThemeToggle.tsx`

```tsx
'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-subtle"
      aria-label={`Attiva modalità ${resolvedTheme === 'dark' ? 'chiara' : 'scura'}`}
      title={`Modalità ${resolvedTheme === 'dark' ? 'chiara' : 'scura'}`}
    >
      {/* Icona cerchio mezzo nero/mezzo bianco */}
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
        <path 
          d="M12 2 A 10 10 0 0 1 12 22 Z" 
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
```

**Testing:**
- Click toggle: HTML classe `dark` si applica/rimuove
- Refresh pagina: Tema persiste da localStorage
- Browser con dark mode system: Rispetta preferenza se theme='system'

---

#### 2.2 Barra Istituzionale

**File (nuovo):** `packages/frontend/src/components/InstitutionalBar.tsx`

```tsx
import { getGlobalContenutiStatici } from '@/lib/payload-api'
import Link from 'next/link'

export async function InstitutionalBar() {
  const contenutiGlobali = await getGlobalContenutiStatici()
  
  // Filtra solo contenuti adatti alla barra istituzionale
  // (es. titolo contenente "Università", "Dipartimento", etc.)
  // Per MVP, mostrare staticament "UNIVERSITÀ DI CAGLIARI · DIGITAL HUMANITIES"
  
  return (
    <div className="bg-bg-inverse text-text-inverse sticky top-0 z-50">
      <div className="container mx-auto px-20 h-11 flex items-center justify-center">
        <p className="label-uppercase text-[11px]">
          Università di Cagliari · Digital Humanities
        </p>
      </div>
    </div>
  )
}
```

**Note:**
- Contenuti da pagine statiche globali: Da implementare query filtrata o campo custom "mostra_in_barra_istituzionale"
- Per MVP: Testo statico hardcoded
- Mobile: Same layout, testo può wrappare su 2 righe se necessario

**Testing:**
- Barra sticky: Resta fissa allo scroll
- Contrasto testo bianco su nero: WCAG AA compliance

---

#### 2.3 Main Navigation

**File:** Sostituire `packages/frontend/src/components/Header.tsx`

```tsx
import Link from 'next/link'
import { getGlobalContenutiStatici, getLemmarioContenutiStatici } from '@/lib/payload-api'
import { ThemeToggle } from './theme/ThemeToggle'

interface MainNavProps {
  lemmarioSlug?: string
  lemmarioId?: number
  lemmarioTitolo?: string
}

export default async function MainNav({ lemmarioSlug, lemmarioId }: MainNavProps) {
  const contenutiGlobali = await getGlobalContenutiStatici()
  const contenutiLemmario = lemmarioId
    ? await getLemmarioContenutiStatici(lemmarioId)
    : []

  return (
    <nav className="bg-bg sticky top-11 z-40 border-b border-border">
      <div className="container mx-auto px-20 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link 
            href="/" 
            className="label-uppercase text-xs text-text-muted hover:text-text transition-colors"
          >
            Home
          </Link>

          {contenutiGlobali.map((contenuto) => (
            <Link
              key={contenuto.id}
              href={`/pagine/${contenuto.slug}`}
              className="label-uppercase text-xs text-text-muted hover:text-text transition-colors"
            >
              {contenuto.titolo}
            </Link>
          ))}

          {contenutiLemmario.map((contenuto) => (
            <Link
              key={contenuto.id}
              href={`/${lemmarioSlug}/pagine/${contenuto.slug}`}
              className="label-uppercase text-xs text-text-muted hover:text-text transition-colors"
            >
              {contenuto.titolo}
            </Link>
          ))}
        </div>

        <ThemeToggle />
      </div>
    </nav>
  )
}
```

**Note:**
- Sticky con `top-11` (altezza barra istituzionale 44px)
- Link in maiuscoletto via classe `label-uppercase`
- Mobile: Drawer/hamburger menu (implementare Fase 3)

**Testing:**
- Nav sticky: Resta sotto barra istituzionale
- Hover links: Cambio colore smooth
- Theme toggle funzionante

---

#### 2.4 Footer Minimale

**File:** Sostituire `packages/frontend/src/components/Footer.tsx`

```tsx
import Link from 'next/link'
import { getGlobalContenutiStatici } from '@/lib/payload-api'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const contenutiStatici = await getGlobalContenutiStatici()
  
  // Filtra pagine Privacy/Contatti (campo slug contenente queste keyword)
  const pagineLegali = contenutiStatici.filter(c => 
    c.slug?.includes('privacy') || c.slug?.includes('contatti')
  )

  return (
    <footer className="border-t border-border mt-auto bg-bg">
      <div className="container mx-auto px-20 py-12">
        {/* 2 colonne desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="label-uppercase text-xs text-text-muted mb-3">
              Istituzione
            </h3>
            <p className="font-serif text-base text-text-body mb-1">
              Università di Cagliari
            </p>
            <p className="font-serif italic text-sm text-text-muted">
              Dipartimento di Lettere, Lingue e Beni Culturali
            </p>
            <p className="font-serif italic text-sm text-text-muted">
              Laboratorio di Digital Humanities per il Medioevo.
            </p>
          </div>

          <div>
            <h3 className="label-uppercase text-xs text-text-muted mb-3">
              Corrispondenza
            </h3>
            <a 
              href="mailto:info@unica-dh.it"
              className="font-serif text-base text-text-body underline hover:text-text transition-colors"
            >
              info@unica-dh.it
            </a>
          </div>
        </div>

        {/* Riga inferiore */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted">
          <p className="label-uppercase mb-4 md:mb-0">
            &copy; {currentYear} UNICA
          </p>
          
          <div className="flex items-center space-x-4">
            {pagineLegali.map((pagina, idx) => (
              <span key={pagina.id} className="flex items-center">
                {idx > 0 && <span className="mx-4">·</span>}
                <Link 
                  href={`/pagine/${pagina.slug}`}
                  className="label-uppercase hover:text-text transition-colors"
                >
                  {pagina.titolo}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
```

**Testing:**
- Layout 2 colonne su desktop, stack su mobile
- Link email funzionante
- Dot separators tra link legali

---

### Fase 3: Pagine e Feature Complesse

#### 3.1 Homepage - Griglia Lemmari con Foto

**File:** Modificare `packages/frontend/src/app/page.tsx`

```tsx
import { getAllLemmariWithStats } from '@/lib/payload-api'
import { InstitutionalBar } from '@/components/InstitutionalBar'
import MainNav from '@/components/MainNav'
import Footer from '@/components/Footer'
import { LemmariGrid } from '@/components/lemmari/LemmariGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glossario',
  description: 'Dizionari storici della terminologia italiana. Glossari specializzati...',
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const lemmari = await getAllLemmariWithStats()

  return (
    <>
      <InstitutionalBar />
      <MainNav />
      
      <main className="flex-1 bg-bg">
        <div className="container mx-auto px-20 py-16">
          {/* Hero section */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-text mb-4">
              Glossario
            </h1>
            <div className="flex items-center justify-center">
              <div className="w-64 h-px bg-border" />
            </div>
            <p className="font-serif italic text-base text-text-muted mt-4">
              {lemmari.length} glossari disponibili
            </p>
          </div>

          <LemmariGrid lemmari={lemmari} />
        </div>
      </main>
      
      <Footer />
    </>
  )
}
```

**File:** Modificare `packages/frontend/src/components/lemmari/LemmariGrid.tsx`

```tsx
import Link from 'next/link'
import Image from 'next/image'

interface Lemmario {
  id: number
  slug: string
  titolo: string
  descrizione?: string
  foto?: {
    url: string
    alt?: string
  }
  _count?: {
    lemmi: number
  }
}

export function LemmariGrid({ lemmari }: { lemmari: Lemmario[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {lemmari.map((lemmario) => (
        <Link
          key={lemmario.id}
          href={`/${lemmario.slug}`}
          className="group block transition-all duration-200 hover:bg-bg-subtle"
        >
          {/* Foto */}
          {lemmario.foto?.url && (
            <div className="aspect-[4/3] relative mb-4 overflow-hidden">
              <Image
                src={lemmario.foto.url}
                alt={lemmario.foto.alt || lemmario.titolo}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Contenuto */}
          <div className="p-6">
            <h2 className="font-serif font-bold text-2xl text-text mb-2">
              {lemmario.titolo}
            </h2>
            
            <p className="label-uppercase text-xs text-text-muted mb-3">
              {lemmario._count?.lemmi || 0} lemmi
            </p>
            
            {lemmario.descrizione && (
              <p className="font-sans text-base text-text-body line-clamp-3">
                {lemmario.descrizione}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
```

**Note:**
- Campo `foto` potrebbe essere `null`: Gestire fallback con div grigio + icona
- `line-clamp-3`: Tronca descrizione a 3 righe
- Hover: Sfondo subtle (`#f5f5f5`)

**Testing:**
- Immagini caricano correttamente
- Aspect ratio 4:3 preservato
- Hover effetto smooth
- Link funzionanti

---

#### 3.2 Sidebar Alfabetica + Pagina Glossario

**File (nuovo):** `packages/frontend/src/components/ui/AlphabetSidebar.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface AlphabetSidebarProps {
  lettereDisponibili: string[] // ['A', 'B', 'C', ...]
  letteraAttiva?: string
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function AlphabetSidebar({ lettereDisponibili, letteraAttiva }: AlphabetSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lettera', letter)
    params.delete('page') // Reset pagination
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <aside className="fixed left-8 top-40 hidden lg:block z-30">
      <nav className="flex flex-col space-y-1">
        {ALPHABET.map((letter) => {
          const isDisabled = !lettereDisponibili.includes(letter)
          const isActive = letteraAttiva === letter

          return (
            <button
              key={letter}
              onClick={() => !isDisabled && handleLetterClick(letter)}
              disabled={isDisabled}
              className={`
                w-8 h-8 flex items-center justify-center
                font-sans text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-bg-inverse text-text-inverse font-bold' 
                  : isDisabled
                    ? 'text-text-disabled cursor-not-allowed'
                    : 'text-text-muted hover:text-text hover:bg-bg-subtle cursor-pointer'
                }
              `}
              aria-label={`Filtra per lettera ${letter}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {letter}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
```

**File (nuovo):** `packages/frontend/src/components/ui/AlphabetDrawer.tsx` (Mobile)

```tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface AlphabetDrawerProps {
  lettereDisponibili: string[]
  letteraAttiva?: string
}

export function AlphabetDrawer({ lettereDisponibili, letteraAttiva }: AlphabetDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lettera', letter)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden z-40 w-14 h-14 rounded-full bg-bg-inverse text-text-inverse shadow-lg flex items-center justify-center label-uppercase text-xs"
      >
        {letteraAttiva || 'A-Z'}
      </button>

      {/* Drawer overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-bg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="label-uppercase text-text-muted">Filtra per lettera</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            {/* Grid 6x5 lettere */}
            <div className="grid grid-cols-6 gap-3">
              {ALPHABET.map((letter) => {
                const isDisabled = !lettereDisponibili.includes(letter)
                const isActive = letteraAttiva === letter

                return (
                  <button
                    key={letter}
                    onClick={() => !isDisabled && handleLetterClick(letter)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center
                      font-sans text-lg rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-bg-inverse text-text-inverse font-bold' 
                        : isDisabled
                          ? 'text-text-disabled cursor-not-allowed'
                          : 'text-text hover:bg-bg-subtle cursor-pointer'
                      }
                    `}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Testing:**
- Desktop: Sidebar fissa sinistra, scroll indipendente
- Mobile: FAB bottom-right, drawer slide-up
- Lettere disabilitate: Non cliccabili, grigio chiaro
- Lettera attiva: Sfondo nero, testo bianco

---

#### 3.3 Card Lemma Aggiornata

**File:** Modificare `packages/frontend/src/components/lemmi/LemmaCard.tsx` (o creare se non esiste)

```tsx
import Link from 'next/link'

interface LemmaCardProps {
  lemma: {
    id: number
    termine: string
    tipo: 'latino' | 'volgare'
    slug: string
    _count?: {
      definizioni: number
      fonti: number // Fonti distinte
      ricorrenze: number // Totale ricorrenze
    }
    definizioni?: Array<{
      testo: string
    }>
  }
  lemmarioSlug: string
}

export function LemmaCard({ lemma, lemmarioSlug }: LemmaCardProps) {
  const primaDefinizione = lemma.definizioni?.[0]?.testo || ''

  return (
    <Link
      href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
      className="block group transition-colors duration-200 hover:bg-bg-subtle"
    >
      <article className="p-6">
        {/* Header: Termine + Badge Tipo */}
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-serif font-bold text-2xl text-text">
            {lemma.termine}
          </h2>
          <span className="label-uppercase text-xs text-text-muted ml-4">
            {lemma.tipo === 'latino' ? 'Latine' : 'Volgare'}
          </span>
        </div>

        {/* Metadati */}
        <div className="label-uppercase text-xs text-text-muted mb-4">
          {lemma._count?.definizioni || 0} def. · {' '}
          {lemma._count?.fonti || 0} fonti · {' '}
          {lemma._count?.ricorrenze || 0} ricorrenze
        </div>

        {/* Preview definizione */}
        {primaDefinizione && (
          <p className="font-sans text-base text-text-body line-clamp-3">
            {primaDefinizione}
          </p>
        )}
      </article>
    </Link>
  )
}
```

**Note:**
- Nessun bordo, nessuna ombra
- Hover: Solo cambio background (`bg-bg-subtle`)
- Badge tipo: Testo grigio maiuscoletto, no background
- Dot separator (`·`) tra metadati

**Testing:**
- Card senza bordi: Verificare separazione visiva
- Hover smooth
- Troncamento testo a 3 righe

---

#### 3.4 Paginazione Minimalista

**File:** Modificare `packages/frontend/src/components/search/Pagination.tsx`

```tsx
import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string // es. "/lemmario-razionale"
  searchParams: Record<string, string> // Preserve filters
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams }: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: page.toString() })
    return `${baseUrl}?${params.toString()}`
  }

  // Generate page numbers with ellipsis
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    pages.push(...Array.from({ length: totalPages }, (_, i) => i + 1))
  } else {
    // Always show: 1 ... current-1 current current+1 ... totalPages
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center justify-center space-x-6 mt-12 pt-8 border-t border-border">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="label-uppercase text-xs text-text-muted hover:text-text transition-colors"
        >
          Precedente
        </Link>
      ) : (
        <span className="label-uppercase text-xs text-text-disabled cursor-not-allowed">
          Precedente
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center space-x-4">
        {pages.map((page, idx) => 
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="text-text-muted">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`
                label-uppercase text-xs transition-colors
                ${page === currentPage 
                  ? 'text-text font-bold' 
                  : 'text-text-muted hover:text-text'
                }
              `}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="label-uppercase text-xs text-text-muted hover:text-text transition-colors"
        >
          Successiva
        </Link>
      ) : (
        <span className="label-uppercase text-xs text-text-disabled cursor-not-allowed">
          Successiva
        </span>
      )}
    </nav>
  )
}
```

**Testing:**
- Paginazione con ellipsis per >7 pagine
- Preserva search params (filtro lettera, ricerca)
- Prev/Next disabilitati ai bordi

---

### Fase 4: Pagine Speciali

#### 4.1 Pagina Dettaglio Lemma

**File:** Modificare `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx`

Layout secondo specifiche:
- Nessuna sidebar alfabetica
- "← Torna al glossario" in alto
- Termine grande in serif + badge tipo
- Varianti grafiche (se presenti)
- Definizioni numerate con livello razionalità
- Ricorrenze in blocchi citazione
- Riferimenti incrociati in fondo

**Implementazione dettagliata:** (omessa per brevità, seguire pattern SPECIFICHE-UI.md sezione 3.3)

---

#### 4.2 Barra Ricerca Underline Style

**File:** Modificare `packages/frontend/src/components/search/SearchBar.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
      params.delete('lettera') // Reset filtro lettera
      params.delete('page') // Reset paginazione
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="relative">
        {/* Icona lente */}
        <svg
          className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Input underline style */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un termine nel glossario..."
          className="
            w-full pl-8 pr-4 py-3
            bg-transparent
            border-0 border-b-2 border-border
            font-sans text-base text-text
            placeholder:text-text-muted
            focus:outline-none focus:border-text
            transition-colors
          "
        />
      </div>
    </div>
  )
}
```

**Note:**
- Solo bordo inferiore (underline style)
- Debounce 300ms
- Reset filtro lettera quando si cerca

**Testing:**
- Focus: Bordo diventa più scuro
- Typing: Debounce funziona
- Reset filtri: URL aggiornato correttamente

---

## Roadmap Implementazione

### Sprint 1: Foundation (5 giorni)

**Giorni 1-2: Design System**
- [ ] Aggiornare Tailwind config (colori monocromatici)
- [ ] Aggiornare `globals.css` (custom properties + dark mode)
- [ ] Aggiungere font Cormorant Garamond in `layout.tsx`
- [ ] Implementare ThemeProvider + ThemeToggle
- [ ] Testing: Verificare palette, font loading, dark mode toggle

**Giorni 3-5: Componenti Core**
- [ ] Implementare InstitutionalBar
- [ ] Refactor Header → MainNav
- [ ] Refactor Footer (2 colonne minimali)
- [ ] Testing: Layout generale, sticky nav, footer responsive

---

### Sprint 2: Backend + Homepage (3 giorni)

**Giorno 6: Backend**
- [ ] Aggiungere campo `foto` a collection Lemmari
- [ ] Creare collection Media (se non esiste)
- [ ] Testing: Upload foto in admin, API response

**Giorni 7-8: Homepage**
- [ ] Modificare `app/page.tsx` (Hero "Glossario")
- [ ] Refactor LemmariGrid (card con foto)
- [ ] Gestire fallback foto mancante
- [ ] Testing: Grid responsive, immagini ottimizzate, link funzionanti

---

### Sprint 3: Sidebar Alfabetica + Pagina Glossario (5 giorni)

**Giorni 9-10: Sidebar**
- [ ] Implementare AlphabetSidebar (desktop sticky)
- [ ] Implementare AlphabetDrawer (mobile FAB + drawer)
- [ ] Logica lettere disponibili (calcolo client-side)
- [ ] Testing: Sticky positioning, filtro funzionante, drawer mobile

**Giorni 11-13: Pagina Glossario**
- [ ] Modificare `[lemmario-slug]/page.tsx` (integrazione sidebar)
- [ ] Refactor LemmaCard (metadati aggiornati, no bordi)
- [ ] SearchBar underline style
- [ ] Paginazione minimalista (16 lemmi/pagina)
- [ ] Testing: Filtro lettera + ricerca + paginazione sincronizzati

---

### Sprint 4: Pagina Dettaglio Lemma (4 giorni)

**Giorni 14-17:**
- [ ] Layout dettaglio lemma (termine grande, varianti, definizioni)
- [ ] Blocchi ricorrenze (citazioni con fonte)
- [ ] Sezione riferimenti incrociati (link cliccabili)
- [ ] Link "Torna al glossario"
- [ ] Testing: Rendering Lexical, link funzionanti, responsive

---

### Sprint 5: Pagine Statiche + Bibliografia (2 giorni)

**Giorni 18-19:**
- [ ] Layout pagine statiche (`/pagine/[slug]`)
- [ ] Pagina bibliografia (`/bibliografia`)
- [ ] Testing: Contenuti Lexical, lista fonti raggruppate per lettera

---

### Sprint 6: Polish + Mobile Optimization (3 giorni)

**Giorni 20-22:**
- [ ] Mobile menu (hamburger nav)
- [ ] Mobile adjustments (spacing, font sizes)
- [ ] Performance audit (lighthouse, bundle size)
- [ ] Accessibility audit (WCAG AA, keyboard nav)
- [ ] Testing cross-browser (Chrome, Firefox, Safari, Edge)

---

### Sprint 7: QA + Deploy (2 giorni)

**Giorni 23-24:**
- [ ] Full regression testing
- [ ] Fix bug critici
- [ ] Deploy staging
- [ ] User acceptance testing
- [ ] Deploy produzione

---

## Testing e QA

### Test Checklist

#### Design System
- [ ] Custom properties applicate correttamente
- [ ] Dark mode funziona su tutti i componenti
- [ ] Font Cormorant Garamond caricato
- [ ] Contrasti colore WCAG AA compliance

#### Componenti
- [ ] InstitutionalBar sticky in cima
- [ ] MainNav sticky sotto barra istituzionale
- [ ] ThemeToggle persiste preferenza
- [ ] Footer layout 2 colonne desktop, stack mobile
- [ ] AlphabetSidebar sticky, scroll indipendente
- [ ] AlphabetDrawer funziona su mobile
- [ ] LemmaCard hover effect smooth
- [ ] SearchBar debounce 300ms
- [ ] Pagination preserva search params

#### Pagine
- [ ] Homepage: Grid lemmari responsive
- [ ] Glossario: Sidebar + ricerca + paginazione sincronizzati
- [ ] Dettaglio lemma: Layout completo, ricorrenze corrette
- [ ] Pagine statiche: Contenuto Lexical renderizzato
- [ ] Bibliografia: Fonti raggruppate per lettera

#### Cross-Browser
- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop)
- [ ] Safari (desktop + iOS)
- [ ] Edge (desktop)

#### Performance
- [ ] Lighthouse score >= 90 (performance)
- [ ] Bundle size < 200KB (first load JS)
- [ ] Immagini lazy load
- [ ] Font swap strategy

#### Accessibility
- [ ] Keyboard navigation completa
- [ ] Screen reader labels corretti
- [ ] Skip to content link
- [ ] Focus visible su tutti elementi interattivi

---

## Deploy

### Pre-Deploy Checklist

- [ ] Tutti i test passano (`pnpm test`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Typecheck passa (`pnpm typecheck`)
- [ ] Build produzione OK (`pnpm build`)
- [ ] Environment variables configurate
- [ ] Database migration completata (campo foto Lemmari)

### Rollout Strategy

1. **Deploy backend** (campo foto + migration)
   - PR su branch `main`
   - CI/CD workflow
   - Verify deployment `/api/lemmari` include campo `foto`

2. **Deploy frontend** (nuova UI)
   - Feature branch → PR → review
   - Deploy staging per UAT
   - Dopo approvazione: merge main + deploy prod

3. **Post-Deploy Verification**
   - Smoke test pagine principali
   - Verificare dark mode
   - Test performance Lighthouse
   - Monitoring errori (Sentry/logs)

---

## Note Finali

### Priorità Features

**Must Have (MVP):**
- Design system completo
- Homepage con foto lemmari
- Sidebar alfabetica
- Ricerca avanzata
- Dark mode
- Paginazione 16 lemmi/pagina

**Nice to Have (Post-MVP):**
- Mobile menu drawer evoluto
- Animazioni transizioni pagina
- Filtri avanzati (periodo storico, tipo)
- Export PDF bibliografia
- Breadcrumb navigation

### Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Font Cormorant Garamond performance | Media | Basso | Font swap strategy, preload |
| Dark mode bugs cross-browser | Alta | Medio | Testing estensivo, fallback |
| Sidebar sticky conflitti mobile | Media | Alto | Drawer alternativo, testing device reali |
| Ricerca definizioni lenta (>1000 lemmi) | Media | Alto | Cache sessionStorage, considerare backend |
| Upload foto lemmari fallisce | Bassa | Alto | Fallback placeholder, validazione formato |

### Metriche Successo

- **Performance:** Lighthouse >= 90
- **Accessibility:** WCAG AA compliance
- **UX:** Time to interactive < 3s
- **Adoption:** Dark mode utilizzato da >= 30% utenti
- **SEO:** Nessuna regressione ranking search engines

---

**Fine Piano Implementazione**
