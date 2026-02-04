# Piano di Implementazione SEO - Lemmario

**Data**: 4 Febbraio 2026
**Dominio**: `glossari.dh.unica.it`
**Organizzazione**: Centro Interdipartimentale per l'Umanistica Digitale - Università di Cagliari

---

## Configurazione Base

| Parametro | Valore |
|-----------|--------|
| Dominio produzione | `https://glossari.dh.unica.it` |
| Trailing slash | No (default Next.js) |
| Lemmi per lemmario | ~500 |
| Solo pubblicati in sitemap | Sì |
| Licenza contenuti | Libera |
| Immagine OG | `lemmario_università_cagliari.jpg` |

### Social Links
- Facebook: https://www.facebook.com/dh.unica
- Telegram: https://t.me/dhunica
- Instagram: https://www.instagram.com/dh.unica

---

## Fase 1: Backend - Configurazione AI Crawler (P0)

### 1.1 Modifica Collection Lemmari

Aggiungere campo dedicato per configurazione SEO/AI nella collection `Lemmari`:

**File**: `packages/payload-cms/src/collections/Lemmari.ts`

```typescript
// Nuovo gruppo di campi SEO dopo "configurazione"
{
  name: 'seo',
  type: 'group',
  label: 'Impostazioni SEO',
  admin: {
    description: 'Configurazioni per motori di ricerca e crawler AI',
  },
  fields: [
    {
      name: 'consenti_ai_crawler',
      type: 'checkbox',
      defaultValue: true,
      label: 'Consenti indicizzazione AI',
      admin: {
        description: 'Se abilitato, crawler AI (GPTBot, ClaudeBot, etc.) possono indicizzare i contenuti di questo lemmario',
      },
    },
    {
      name: 'meta_description',
      type: 'textarea',
      label: 'Meta Description',
      admin: {
        description: 'Descrizione per motori di ricerca (150-160 caratteri). Se vuoto, usa "descrizione"',
      },
    },
    {
      name: 'og_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Immagine Social',
      admin: {
        description: 'Immagine per condivisioni social (1200x630px). Se vuota, usa immagine di default',
      },
    },
  ],
},
```

### 1.2 Endpoint API per robots.txt dinamico

Creare endpoint che restituisce configurazione AI per i robots:

**File**: `packages/payload-cms/src/endpoints/seo.ts` (nuovo)

```typescript
import { Endpoint } from 'payload/config'

export const seoEndpoints: Endpoint[] = [
  {
    path: '/seo/ai-config',
    method: 'get',
    handler: async (req, res) => {
      const payload = req.payload
      const lemmari = await payload.find({
        collection: 'lemmari',
        where: { attivo: { equals: true } },
        limit: 100,
      })

      const config = lemmari.docs.map(l => ({
        slug: l.slug,
        consenti_ai: l.seo?.consenti_ai_crawler ?? true,
      }))

      res.json(config)
    },
  },
]
```

---

## Fase 2: robots.txt Dinamico (P1)

### 2.1 Route Handler

**File**: `packages/frontend/src/app/robots.ts` (nuovo)

```typescript
import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://glossari.dh.unica.it/api'

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Fetch configurazione AI per lemmario
  let aiBlockedPaths: string[] = []

  try {
    const res = await fetch(`${API_URL}/seo/ai-config`, {
      next: { revalidate: 3600 } // Cache 1 ora
    })
    const config = await res.json()

    // Genera path bloccati per lemmari che non consentono AI
    aiBlockedPaths = config
      .filter((l: any) => !l.consenti_ai)
      .map((l: any) => `/${l.slug}/`)
  } catch (e) {
    console.error('Failed to fetch AI config:', e)
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/ricerca?*', // Evita indicizzazione parametri ricerca
        ],
      },
      // Regole specifiche per AI crawlers
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended'],
        allow: '/',
        disallow: aiBlockedPaths,
      },
      {
        userAgent: ['ClaudeBot', 'Claude-Web', 'anthropic-ai'],
        allow: '/',
        disallow: aiBlockedPaths,
      },
      {
        userAgent: ['CCBot', 'PerplexityBot'],
        allow: '/',
        disallow: aiBlockedPaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

---

## Fase 3: sitemap.xml Dinamica (P0)

### 3.1 Sitemap Index con Sub-Sitemap

**File**: `packages/frontend/src/app/sitemap.ts` (nuovo)

```typescript
import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://glossari.dh.unica.it/api'

interface Lemmario {
  id: number
  slug: string
  titolo: string
  updatedAt: string
}

interface Lemma {
  id: number
  slug: string
  termine: string
  updatedAt: string
  lemmario: Lemmario
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // 1. Home page
  entries.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  try {
    // 2. Fetch tutti i lemmari attivi
    const lemmariRes = await fetch(`${API_URL}/lemmari?where[attivo][equals]=true&limit=100`, {
      next: { revalidate: 3600 },
    })
    const lemmariData = await lemmariRes.json()
    const lemmari: Lemmario[] = lemmariData.docs || []

    // Aggiungi pagine lemmario
    for (const lemmario of lemmari) {
      entries.push({
        url: `${SITE_URL}/${lemmario.slug}`,
        lastModified: new Date(lemmario.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      })

      // 3. Fetch lemmi pubblicati per questo lemmario
      const lemmiRes = await fetch(
        `${API_URL}/lemmi?where[lemmario][equals]=${lemmario.id}&where[pubblicato][equals]=true&limit=1000`,
        { next: { revalidate: 3600 } }
      )
      const lemmiData = await lemmiRes.json()
      const lemmi: Lemma[] = lemmiData.docs || []

      // Aggiungi ogni lemma
      for (const lemma of lemmi) {
        entries.push({
          url: `${SITE_URL}/${lemmario.slug}/lemmi/${lemma.slug}`,
          lastModified: new Date(lemma.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }

    // 4. Fetch contenuti statici
    const contenutiRes = await fetch(
      `${API_URL}/contenuti-statici?where[pubblicato][equals]=true&limit=100`,
      { next: { revalidate: 3600 } }
    )
    const contenutiData = await contenutiRes.json()

    for (const contenuto of contenutiData.docs || []) {
      const path = contenuto.lemmario
        ? `/${contenuto.lemmario.slug}/pagine/${contenuto.slug}`
        : `/pagine/${contenuto.slug}`

      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: new Date(contenuto.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

  } catch (e) {
    console.error('Sitemap generation error:', e)
  }

  return entries
}
```

---

## Fase 4: Metadata Pagina Lemma (P0)

### 4.1 generateMetadata per Lemma Detail

**File**: `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx`

Aggiungere funzione `generateMetadata`:

```typescript
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

interface Props {
  params: { 'lemmario-slug': string; termine: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lemmarioSlug = params['lemmario-slug']
  const termine = params.termine

  // Fetch lemma data
  const lemma = await fetchLemma(lemmarioSlug, termine)
  const lemmario = await fetchLemmario(lemmarioSlug)

  if (!lemma || !lemmario) {
    return {
      title: 'Lemma non trovato',
    }
  }

  // Costruisci description dalle definizioni
  const primaDefinizione = lemma.definizioni?.[0]?.testo || lemma.descrizione || ''
  const description = primaDefinizione.length > 160
    ? primaDefinizione.substring(0, 157) + '...'
    : primaDefinizione

  const title = `${lemma.termine} - ${lemmario.titolo}`
  const url = `${SITE_URL}/${lemmarioSlug}/lemmi/${termine}`
  const ogImage = lemmario.seo?.og_image?.url || `${SITE_URL}/og-image.jpg`

  return {
    title,
    description,
    keywords: [lemma.termine, lemmario.titolo, 'dizionario storico', 'lessico italiano'],
    authors: [{ name: 'Centro Umanistica Digitale - UniCa' }],

    alternates: {
      canonical: url,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: 'Glossari - Università di Cagliari',
      type: 'article',
      locale: 'it_IT',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${lemma.termine} - ${lemmario.titolo}`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },

    other: {
      'citation_title': lemma.termine,
      'citation_publisher': 'Università degli Studi di Cagliari',
    },
  }
}
```

### 4.2 Metadata Pagina Ricerca

**File**: `packages/frontend/src/app/ricerca/page.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ricerca - Glossari Università di Cagliari',
  description: 'Cerca tra i lemmi dei glossari storici della terminologia matematica ed economica italiana',
  robots: {
    index: false, // Non indicizzare pagine di ricerca
    follow: true,
  },
}
```

---

## Fase 5: Open Graph Completo (P1)

### 5.1 Immagine di Default

Copiare l'immagine fornita in:
```
packages/frontend/public/og-image.jpg
```

Dimensioni raccomandate: 1200x630px (già corrette)

### 5.2 Layout Root - Metadata Base

**File**: `packages/frontend/src/app/layout.tsx`

```typescript
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: '%s | Glossari UniCa',
    default: 'Glossari - Dizionari Storici | Università di Cagliari',
  },

  description: 'Glossari della terminologia matematica ed economica italiana storica. Progetto del Centro Interdipartimentale per l\'Umanistica Digitale.',

  keywords: ['glossario', 'dizionario storico', 'lessico italiano', 'matematica medievale', 'economia medievale', 'umanistica digitale'],

  authors: [{ name: 'Centro Umanistica Digitale - Università di Cagliari' }],

  creator: 'Centro Interdipartimentale per l\'Umanistica Digitale',
  publisher: 'Università degli Studi di Cagliari',

  formatDetection: {
    email: false,
    telephone: false,
  },

  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'Glossari - Università di Cagliari',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Glossari dell\'Università di Cagliari',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    // Aggiungere quando disponibili
    // google: 'google-site-verification-code',
  },

  category: 'education',
}
```

---

## Fase 6: JSON-LD Structured Data (P2)

### 6.1 Componente JSON-LD Riutilizzabile

**File**: `packages/frontend/src/components/seo/JsonLd.tsx` (nuovo)

```typescript
interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### 6.2 Schema Organization

**File**: `packages/frontend/src/components/seo/OrganizationSchema.tsx` (nuovo)

```typescript
import { JsonLd } from './JsonLd'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': 'https://glossari.dh.unica.it/#organization',
    name: 'Centro Interdipartimentale per l\'Umanistica Digitale',
    alternateName: 'DH UniCa',
    url: 'https://glossari.dh.unica.it',
    logo: 'https://glossari.dh.unica.it/og-image.jpg',
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Università degli Studi di Cagliari',
      url: 'https://www.unica.it',
    },
    sameAs: [
      'https://www.facebook.com/dh.unica',
      'https://www.instagram.com/dh.unica',
      'https://t.me/dhunica',
    ],
  }

  return <JsonLd data={schema} />
}
```

### 6.3 Schema WebSite con SearchAction

**File**: `packages/frontend/src/components/seo/WebSiteSchema.tsx` (nuovo)

```typescript
import { JsonLd } from './JsonLd'

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://glossari.dh.unica.it/#website',
    url: 'https://glossari.dh.unica.it',
    name: 'Glossari - Università di Cagliari',
    description: 'Glossari della terminologia matematica ed economica italiana storica',
    publisher: {
      '@id': 'https://glossari.dh.unica.it/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://glossari.dh.unica.it/ricerca?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'it-IT',
  }

  return <JsonLd data={schema} />
}
```

### 6.4 Schema DefinedTerm per Lemmi

**File**: `packages/frontend/src/components/seo/LemmaSchema.tsx` (nuovo)

```typescript
import { JsonLd } from './JsonLd'

interface LemmaSchemaProps {
  lemma: {
    termine: string
    slug: string
    tipo?: string
    definizioni?: Array<{
      testo: string
      ordine: number
    }>
  }
  lemmario: {
    slug: string
    titolo: string
  }
}

export function LemmaSchema({ lemma, lemmario }: LemmaSchemaProps) {
  const url = `https://glossari.dh.unica.it/${lemmario.slug}/lemmi/${lemma.slug}`

  // Prendi la prima definizione come description
  const primaDefinizione = lemma.definizioni?.[0]?.testo || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': url,
    name: lemma.termine,
    description: primaDefinizione,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `https://glossari.dh.unica.it/${lemmario.slug}`,
      name: lemmario.titolo,
      url: `https://glossari.dh.unica.it/${lemmario.slug}`,
    },
    url: url,
    // Indica che è un termine storico
    ...(lemma.tipo === 'latino' && {
      termCode: 'lat',
      inLanguage: 'la',
    }),
    ...(lemma.tipo === 'volgare' && {
      inLanguage: 'it',
    }),
  }

  return <JsonLd data={schema} />
}
```

### 6.5 Schema BreadcrumbList

**File**: `packages/frontend/src/components/seo/BreadcrumbSchema.tsx` (nuovo)

```typescript
import { JsonLd } from './JsonLd'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={schema} />
}
```

### 6.6 Integrazione nel Layout

**File**: `packages/frontend/src/app/layout.tsx`

```typescript
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { WebSiteSchema } from '@/components/seo/WebSiteSchema'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 6.7 Integrazione nella Pagina Lemma

**File**: `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx`

```typescript
import { LemmaSchema } from '@/components/seo/LemmaSchema'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export default async function LemmaPage({ params }: Props) {
  const lemma = await fetchLemma(...)
  const lemmario = await fetchLemmario(...)

  const breadcrumbs = [
    { name: 'Home', url: 'https://glossari.dh.unica.it' },
    { name: lemmario.titolo, url: `https://glossari.dh.unica.it/${lemmario.slug}` },
    { name: lemma.termine, url: `https://glossari.dh.unica.it/${lemmario.slug}/lemmi/${lemma.slug}` },
  ]

  return (
    <>
      <LemmaSchema lemma={lemma} lemmario={lemmario} />
      <BreadcrumbSchema items={breadcrumbs} />
      {/* resto del contenuto */}
    </>
  )
}
```

---

## Fase 7: Configurazione Next.js (P1)

### 7.1 Aggiornamento next.config.js

**File**: `packages/frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: [
      'localhost',
      'glossari.dh.unica.it',
      // Payload media domain se diverso
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Opzionale: redirects per URL legacy
  async redirects() {
    return [
      // Esempio: redirect da vecchio sito
      // {
      //   source: '/lemmi/:slug',
      //   destination: '/matematica/lemmi/:slug',
      //   permanent: true,
      // },
    ]
  },
}

module.exports = nextConfig
```

---

## Fase 8: File Statici (P3)

### 8.1 Immagine OG

Copiare immagine in:
```bash
cp docs/lemmario_università_cagliari.jpg packages/frontend/public/og-image.jpg
```

### 8.2 Favicon (se mancante)

Creare o copiare:
- `packages/frontend/public/favicon.ico`
- `packages/frontend/public/apple-touch-icon.png` (180x180)
- `packages/frontend/public/icon-192.png`
- `packages/frontend/public/icon-512.png`

---

## Checklist Implementazione

### Fase 1: Backend (Effort: Basso) ✅ COMPLETATA
- [x] Aggiungere campo `seo` alla collection Lemmari
- [x] Funzioni API per configurazione AI crawler
- [x] Tipo TypeScript aggiornato

### Fase 2: robots.txt (Effort: Basso) ✅ COMPLETATA
- [x] Creare `src/app/robots.ts`
- [x] Blocco dinamico AI crawler per-lemmario
- [ ] Testare con Google Search Console (post-deploy)

### Fase 3: sitemap.xml (Effort: Medio) ✅ COMPLETATA
- [x] Creare `src/app/sitemap.ts`
- [x] Include lemmari, lemmi e contenuti statici
- [ ] Sottomettere a Google Search Console (post-deploy)

### Fase 4: Metadata Lemma (Effort: Medio) ✅ COMPLETATA
- [x] Aggiungere `generateMetadata` a pagina lemma
- [x] Aggiungere metadata a pagina ricerca
- [ ] Testare con og:debugger Facebook (post-deploy)

### Fase 5: Open Graph (Effort: Basso) ✅ COMPLETATA
- [x] Copiare immagine OG in public/
- [x] Aggiornare layout.tsx con metadata base
- [x] JSON-LD Organization e WebSite nel layout
- [ ] Testare condivisione social (post-deploy)

### Fase 6: JSON-LD Avanzato (Effort: Alto) ✅ COMPLETATA

- [x] Creare componenti Schema per lemmi (DefinedTerm)
- [x] BreadcrumbList schema nelle pagine
- [x] Testare con Google Rich Results Test (locale)

### Fase 7: Configurazione (Effort: Basso) ✅ COMPLETATA
- [x] Aggiornare next.config.js
- [x] Configurare headers sicurezza
- [x] remotePatterns per immagini

### Fase 8: File Statici (Effort: Basso) ✅ COMPLETATA
- [x] Copiare og-image.jpg
- [ ] Verificare/creare favicon (opzionale)
- [ ] Testare manifest (opzionale)

---

## Test e Validazione

### Strumenti di Test

| Strumento | URL | Cosa testa |
|-----------|-----|------------|
| Google Rich Results | https://search.google.com/test/rich-results | JSON-LD |
| Facebook Debugger | https://developers.facebook.com/tools/debug | Open Graph |
| Twitter Card Validator | https://cards-dev.twitter.com/validator | Twitter Cards |
| Google Search Console | https://search.google.com/search-console | Sitemap, robots |
| Bing Webmaster Tools | https://www.bing.com/webmasters | Indicizzazione Bing |

### Comandi di Test Locale

```bash
# Verifica robots.txt
curl http://localhost:3001/robots.txt

# Verifica sitemap
curl http://localhost:3001/sitemap.xml

# Verifica headers
curl -I http://localhost:3001/

# Verifica JSON-LD (dopo build)
curl -s http://localhost:3001/matematica/lemmi/additio | grep -o '<script type="application/ld+json">.*</script>'
```

---

## Timeline Suggerita

| Fase | Descrizione | Giorni |
|------|-------------|--------|
| 1-2 | Backend + robots.txt | 1 |
| 3 | Sitemap dinamica | 1 |
| 4-5 | Metadata + OG | 1 |
| 6 | JSON-LD | 2 |
| 7-8 | Config + statici | 0.5 |
| Test | Validazione completa | 0.5 |
| **Totale** | | **~6 giorni** |

---

## Note Tecniche

### Caching
- Sitemap e robots.txt usano `revalidate: 3600` (1 ora)
- In produzione considerare webhook per invalidare cache su modifica lemmi

### Performance
- JSON-LD è inline nel HTML, nessun impatto su LCP
- Metadata generati server-side, nessun impatto client

### SEO Monitoring
- Configurare Google Search Console dopo deploy
- Monitorare Core Web Vitals
- Tracciare indicizzazione lemmi nel tempo

---

*Piano generato il 4 Febbraio 2026*
