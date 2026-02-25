/**
 * TypeScript types for Payload CMS collections
 * These are simplified versions for frontend use
 */

export interface PayloadMedia {
  id: number
  alt: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  sizes?: {
    thumbnail?: { url: string; width: number; height: number }
    card?: { url: string; width: number; height: number }
  }
  updatedAt: string
  createdAt: string
}

export interface LemmarioSEO {
  consenti_ai_crawler?: boolean
  meta_description?: string
}

export interface Lemmario {
  id: number
  slug: string
  titolo: string
  descrizione?: string
  periodo_storico?: string
  attivo?: boolean
  ordine?: number
  foto?: number | PayloadMedia
  configurazione?: Record<string, unknown>
  seo?: LemmarioSEO
  data_pubblicazione?: string
  updatedAt: string
  createdAt: string
}

export interface Utente {
  id: number
  nome: string
  cognome: string
  email: string
  ruolo: 'super_admin' | 'lemmario_admin' | 'redattore' | 'lettore'
  attivo?: boolean
  note?: string
  updatedAt: string
  createdAt: string
}

export interface Lemma {
  id: number
  termine: string
  tipo: 'latino' | 'volgare'
  slug: string
  lemmario: number | Lemmario
  redattore?: number | Utente
  etimologia?: string
  note_redazionali?: string
  status?: 'draft' | 'published'
  _status?: 'draft' | 'published'
  updatedAt: string
  createdAt: string
  publishedAt?: string
}

/**
 * Lemma con tutte le relazioni popolate (depth >= 2)
 */
export interface LemmaDettagliato extends Lemma {
  definizioni?: Array<Definizione & {
    livello_razionalita?: LivelloRazionalita
    ricorrenze?: Array<Ricorrenza & { fonte?: Fonte }>
  }>
  varianti?: VarianteGrafica[]
  riferimenti_in_uscita?: Array<RiferimentoIncrociato & { lemma_destinazione?: Lemma }>
}

export interface VarianteGrafica {
  id: number
  lemma: number | Lemma
  variante: string
  note?: string
  updatedAt: string
  createdAt: string
}

export interface Definizione {
  id: number
  lemma: number | Lemma
  numero: number
  testo: string
  livello_razionalita?: number | LivelloRazionalita
  updatedAt: string
  createdAt: string
}

export interface Fonte {
  id: number
  shorthand_id: string
  titolo: string
  autore?: string
  anno?: string
  tipo_fonte?: string
  editore?: string
  luogo_pubblicazione?: string
  pagine?: string
  url?: string
  riferimento_completo?: string
  note_bibliografiche?: string
  lemmario: number | Lemmario
  updatedAt: string
  createdAt: string
}

export interface Ricorrenza {
  id: number
  definizione: number | Definizione
  fonte: number | Fonte
  testo_originale: string
  pagina_raw?: string
  note?: string
  ordine?: number
  updatedAt: string
  createdAt: string
}

export interface LivelloRazionalita {
  id: number
  livello?: number
  numero?: number
  nome: string
  descrizione?: string
  ordine?: number
  lemmario: number | Lemmario
  updatedAt: string
  createdAt: string
}

export interface RiferimentoIncrociato {
  id: number
  lemma_origine: number | Lemma
  lemma_destinazione: number | Lemma
  tipo_riferimento: string
  note?: string
  auto_creato?: boolean
  updatedAt: string
  createdAt: string
}

export interface ContenutoStatico {
  id: number
  slug: string
  titolo: string
  contenuto?: {
    root: {
      type: string
      children: Array<Record<string, unknown>>
      direction?: string
      format?: string
      indent?: number
      version?: number
    }
  }
  lemmario?: number | Lemmario
  pubblicato?: boolean
  updatedAt: string
  createdAt: string
}

/**
 * Payload API response types
 */
export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export interface SingleDocResponse<T> {
  doc: T
}
