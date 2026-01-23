/**
 * HTML Parser for legacy lemma files
 */

import * as cheerio from 'cheerio'
import { ParsedLemma, ParsedDefinizione, ParsedRicorrenza } from '../types'

/**
 * Parsa un riferimento pagina/carta/colonna complesso e estrae i campi strutturati
 */
function parseRiferimento(riferimentoText: string): Partial<ParsedRicorrenza> {
  const result: Partial<ParsedRicorrenza> = {
    pagina_raw: riferimentoText.trim(),
  }

  // Pattern 1: Colonna + rubrica + titolo (più complesso)
  // Es: "col. 102, rubr. 176 "De quinque soldis...""
  const colRubrPattern = /(?:col\.|colonna)\s+(\d+),\s+(?:rubr\.|rubrica)\.?\s*(\d+)?\s*"([^"]+)"/
  let match = riferimentoText.match(colRubrPattern)
  if (match) {
    result.tipo_riferimento = 'colonna'
    result.numero = match[1]
    result.rubrica_numero = match[2] || undefined
    result.rubrica_titolo = match[3]
    return result
  }

  // Pattern 2: Colonna + supplemento + rubrica
  // Es: "col. 741, supplemento I, rubr. "De reddenda ratione...""
  const colSupplPattern = /col\.\s+(\d+),\s+supplemento\s+(n\.\s+\d+|[IVX]+),\s+rubr\.\s+"([^"]+)"/
  match = riferimentoText.match(colSupplPattern)
  if (match) {
    result.tipo_riferimento = 'colonna'
    result.numero = match[1]
    result.supplemento = match[2]
    result.rubrica_titolo = match[3]
    return result
  }

  // Pattern 3: Pagina + rubrica + titolo + sezione
  // Es: "p. 187, prima sezione degli statuti del Comune, rubrica 1, "De la provisione...""
  const pSezionePattern = /p\.\s+(\d+),\s+(prima|seconda|terza|quarta)\s+sezione\s+(?:degli statuti del Comune|dello statuto del Comune).*?,\s+(?:rubr\.|rubrica)\.?\s*(\d+),?\s*"([^"]+)"/
  match = riferimentoText.match(pSezionePattern)
  if (match) {
    result.tipo_riferimento = 'pagina'
    result.numero = match[1]
    result.sezione = `${match[2]} sezione`
    result.rubrica_numero = match[3]
    result.rubrica_titolo = match[4]
    return result
  }

  // Pattern 4: Pagina + rubrica + titolo (comune)
  // Es: "p. 100, rubrica 27, "De eleggiare coloro...""
  const pRubrPattern = /p\.\s+(\d+[rv]?),\s+(?:rubr\.|rubrica)\.?\s*(\d+),?\s*"([^"]+)"/
  match = riferimentoText.match(pRubrPattern)
  if (match) {
    result.tipo_riferimento = 'pagina'
    result.numero = match[1]
    result.rubrica_numero = match[2]
    result.rubrica_titolo = match[3]
    return result
  }

  // Pattern 5: Pagine multiple (pp.)
  // Es: "pp. 54-55."
  const ppPattern = /pp\.\s+(\d+)-(\d+)/
  match = riferimentoText.match(ppPattern)
  if (match) {
    result.tipo_riferimento = 'pagina'
    result.numero = `${match[1]}-${match[2]}`
    return result
  }

  // Pattern 6: Pagina singola con recto/verso
  // Es: "p. 157r.", "p. 85v."
  const pRvPattern = /p\.\s+(\d+)([rv])/
  match = riferimentoText.match(pRvPattern)
  if (match) {
    result.tipo_riferimento = 'pagina'
    result.numero = `${match[1]}${match[2]}`
    return result
  }

  // Pattern 7: Pagina singola semplice
  // Es: "p. 135."
  const pSimplePattern = /p\.\s+(\d+)/
  match = riferimentoText.match(pSimplePattern)
  if (match) {
    result.tipo_riferimento = 'pagina'
    result.numero = match[1]
    return result
  }

  // Pattern 8: Carta con range recto-verso
  // Es: "c. 11r-v."
  const cRvRangePattern = /c\.\s+(\d+)r-v/
  match = riferimentoText.match(cRvRangePattern)
  if (match) {
    result.tipo_riferimento = 'carta'
    result.numero = `${match[1]}r-v`
    return result
  }

  // Pattern 9: Carta con recto/verso
  // Es: "c. 150r.", "c. 16v."
  const cRvPattern = /c\.\s+(\d+)([rv])/
  match = riferimentoText.match(cRvPattern)
  if (match) {
    result.tipo_riferimento = 'carta'
    result.numero = `${match[1]}${match[2]}`
    return result
  }

  // Pattern 10: Folio
  // Es: "f. 6r."
  const fPattern = /f\.\s+(\d+)([rv])/
  match = riferimentoText.match(fPattern)
  if (match) {
    result.tipo_riferimento = 'folio'
    result.numero = `${match[1]}${match[2]}`
    return result
  }

  // Pattern 11: Colonna semplice
  // Es: "col. 161."
  const colSimplePattern = /(?:col\.|colonna)\s+(\d+)/
  match = riferimentoText.match(colSimplePattern)
  if (match) {
    result.tipo_riferimento = 'colonna'
    result.numero = match[1]
    return result
  }

  // Se nessun pattern matcha, ritorna solo il raw
  return result
}

export function parseLemmaHTML(html: string, termine: string, tipo: 'volgare' | 'latino'): ParsedLemma {
  const $ = cheerio.load(html)
  const definizioni: ParsedDefinizione[] = []
  const varianti: Set<string> = new Set()
  const contenuto_ignorato: string[] = []

  // Il titolo potrebbe contenere varianti
  const titolo = $('.titolo-lemma').text().trim()

  // Trova tutte le definizioni (separate da <hr>)
  const content = $('#lemma').html() || ''
  const sections = content.split('<hr>')

  sections.forEach((section, index) => {
    const $section = cheerio.load(section)

    // Cerca il numero della definizione e il testo
    const defMatch = $section.html()?.match(/<p><strong>(\d+)\.<\/strong>\s*(.+?)<\/p>/)
    if (!defMatch) {
      // Sezione senza numero di definizione - potrebbe essere contenuto ignorato
      const sectionText = $section.text().trim()
      if (sectionText && sectionText.length > 10) {
        contenuto_ignorato.push(`Sezione ${index + 1} senza numero definizione: ${sectionText.substring(0, 100)}...`)
      }
      return
    }

    const numero = parseInt(defMatch[1])
    // Rimuovi HTML tags dal testo della definizione e decodifica entities
    const $temp = cheerio.load(`<div>${defMatch[2]}</div>`)
    const testoDefinizione = $temp.text().trim()

    // Estrai livello di razionalità
    let livello_razionalita: number | undefined
    const livelloMatch = $section.html()?.match(/Livello di razionalità:<\/strong>\s*(\d+)/)
    if (livelloMatch) {
      livello_razionalita = parseInt(livelloMatch[1])
    }

    // Estrai ricorrenze
    const ricorrenze: ParsedRicorrenza[] = []
    $section('li').each((i, li) => {
      const $li = $(li)
      const link = $li.find('a.bibliografia-link')
      const shorthand_id = link.attr('data-biblio') || ''

      // Estrai la citazione
      const citazioneP = $li.find('p').text()

      // Cerca la citazione tra virgolette
      const citazioneMatch = citazioneP.match(/«(.+?)»/)
      const citazione_originale = citazioneMatch ? citazioneMatch[1].trim() : ''

      // Estrai tutto il testo dopo le virgolette chiuse (») fino alla fine
      const riferimentoFullMatch = citazioneP.match(/»\s*-?\s*(.+)$/)
      const riferimentoText = riferimentoFullMatch ? riferimentoFullMatch[1].trim() : ''

      // Parsa il riferimento per estrarre campi strutturati
      const riferimentoParsed = riferimentoText ? parseRiferimento(riferimentoText) : {}

      // Verifica se il riferimento è stato parsato correttamente
      if (riferimentoText && !riferimentoParsed.tipo_riferimento) {
        contenuto_ignorato.push(`Riferimento non parsato: "${riferimentoText}"`)
      }

      if (citazione_originale && shorthand_id) {
        ricorrenze.push({
          citazione_originale,
          shorthand_id,
          ...riferimentoParsed,
        })
      } else {
        // Ricorrenza incompleta
        const ricText = $li.text().trim()
        if (ricText.length > 10) {
          contenuto_ignorato.push(`Ricorrenza incompleta (citazione o fonte mancante): ${ricText.substring(0, 100)}...`)
        }
      }
    })

    definizioni.push({
      numero,
      testo: testoDefinizione,
      livello_razionalita,
      ricorrenze,
    })
  })

  // Converti le varianti in array
  const variantiArray = Array.from(varianti)

  // Genera slug includendo il tipo per distinguere lemmi bilingue
  const slugBase = termine
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const slug = tipo === 'latino' ? `${slugBase}-lat` : slugBase

  return {
    termine,
    tipo,
    slug,
    definizioni,
    varianti: variantiArray,
    contenuto_ignorato,
  }
}

export function extractShorthandIds(html: string): string[] {
  const $ = cheerio.load(html)
  const shorthandIds: Set<string> = new Set()

  $('a.bibliografia-link').each((i, el) => {
    const id = $(el).attr('data-biblio')
    if (id) shorthandIds.add(id)
  })

  return Array.from(shorthandIds)
}
