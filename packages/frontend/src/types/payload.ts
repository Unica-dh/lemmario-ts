/**
 * TypeScript types for Payload CMS collections
 * These are simplified versions for frontend use
 */

export interface Lemmario {
  id: number
  slug: string
  titolo: string
  descrizione?: string
  periodo_storico?: string
  attivo?: boolean
  ordine?: number
  configurazione?: Record<string, unknown>
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
  numero_definizione: number
  testo_definizione: string
  contesto_uso?: string
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
  note_bibliografiche?: string
  lemmario: number | Lemmario
  updatedAt: string
  createdAt: string
}

export interface Ricorrenza {
  id: number
  definizione: number | Definizione
  fonte: number | Fonte
  citazione_originale: string
  trascrizione_moderna?: string
  pagina_riferimento?: string
  note_filologiche?: string
  updatedAt: string
  createdAt: string
}

export interface LivelloRazionalita {
  id: number
  livello: number
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
  tipo: 'sinonimo' | 'contrario' | 'correlato' | 'vedi_anche'
  note?: string
  updatedAt: string
  createdAt: string
}

export interface ContenutoStatico {
  id: number
  slug: string
  titolo: string
  contenuto?: string
  lemmario?: number | Lemmario
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
