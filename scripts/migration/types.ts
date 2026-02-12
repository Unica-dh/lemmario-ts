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

export interface ParsedCrossReference {
  target_filename: string    // es. "camera_volg.html"
  target_lemma_name: string  // es. "camera"
  language_prefix: string    // "lat." o "volg."
}

export interface ParsedLemma {
  termine: string
  tipo: 'volgare' | 'latino'
  slug: string
  etimologia?: string
  definizioni: ParsedDefinizione[]
  varianti: string[]
  contenuto_ignorato: string[]  // Porzioni HTML non parsate
  riferimenti_incrociati: ParsedCrossReference[]
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
  pagina_raw?: string  // Testo originale completo del riferimento
  shorthand_id: string
  note_filologiche?: string
  // Campi strutturati per riferimenti
  tipo_riferimento?: 'pagina' | 'carta' | 'colonna' | 'folio' | 'misto'
  numero?: string
  numero_secondario?: string
  rubrica_numero?: string
  rubrica_titolo?: string
  libro?: string
  capitolo?: string
  sezione?: string
  supplemento?: string
}

export interface LemmaImportDetail {
  termine: string
  tipo: 'volgare' | 'latino'
  status: 'success' | 'failed' | 'partial'
  definizioni_importate: number
  ricorrenze_importate: number
  varianti_importate: number
  riferimenti_importati: number
  contenuto_ignorato: string[]
  errori: string[]
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
  varianti: {
    total: number
    imported: number
  }
  livelli: {
    total: number
    loaded: number
  }
  riferimenti_incrociati: {
    total: number
    imported: number
    skipped_duplicate: number
    skipped_missing_target: number
    failed: number
    errors: string[]
  }
}

export interface MigrationReport {
  timestamp: string
  duration_ms: number
  summary: MigrationStats
  lemmi_details: LemmaImportDetail[]
  fonti_mancanti: string[]
  contenuti_ignorati_globali: string[]
}
