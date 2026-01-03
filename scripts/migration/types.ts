/**
 * Types for migration scripts
 */

export interface LegacyLemma {
  nome: string
  tipo: 'volgare' | 'latino'
  file: string
}

export interface LegacyBibliografia {
  [key: string]: {
    title: string
    date?: string
    reference: string
    author?: string
    publisher?: string
    place?: string
    pages?: string
    url?: string
  }
}

export interface ParsedLemma {
  termine: string
  tipo: 'volgare' | 'latino'
  slug: string
  etimologia?: string
  definizioni: ParsedDefinizione[]
  varianti: string[]
}

export interface ParsedDefinizione {
  numero: number
  testo: string
  contesto?: string
  livello_razionalita?: number
  ricorrenze: ParsedRicorrenza[]
}

export interface ParsedRicorrenza {
  citazione_originale: string
  trascrizione_moderna?: string
  pagina_riferimento?: string
  shorthand_id: string
  note_filologiche?: string
}

export interface MigrationStats {
  fonti: {
    total: number
    imported: number
    failed: number
    errors: string[]
  }
  lemmi: {
    total: number
    imported: number
    failed: number
    errors: string[]
  }
  definizioni: {
    total: number
    imported: number
  }
  ricorrenze: {
    total: number
    imported: number
  }
}
