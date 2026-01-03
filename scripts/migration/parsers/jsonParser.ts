/**
 * JSON Parser for legacy bibliografia and indice
 */

import { LegacyBibliografia, LegacyLemma } from '../types'
import * as fs from 'fs'
import * as path from 'path'

export function parseBibliografia(jsonPath: string): LegacyBibliografia {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(content)
}

export function parseIndice(jsonPath: string): LegacyLemma[] {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(content)
  return data.lemmi || []
}

export function convertBiblioToFonte(shorthandId: string, biblio: LegacyBibliografia[string]) {
  return {
    shorthand_id: shorthandId,
    titolo: biblio.title,
    autore: biblio.author,
    anno: biblio.date,
    riferimento_completo: biblio.reference,
    note: biblio.url ? `URL: ${biblio.url}` : undefined,
  }
}
