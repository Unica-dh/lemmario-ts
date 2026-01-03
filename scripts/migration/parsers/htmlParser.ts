/**
 * HTML Parser for legacy lemma files
 */

import * as cheerio from 'cheerio'
import { ParsedLemma, ParsedDefinizione, ParsedRicorrenza } from '../types'

export function parseLemmaHTML(html: string, termine: string, tipo: 'volgare' | 'latino'): ParsedLemma {
  const $ = cheerio.load(html)
  const definizioni: ParsedDefinizione[] = []
  const varianti: Set<string> = new Set()

  // Il titolo potrebbe contenere varianti
  const titolo = $('.titolo-lemma').text().trim()

  // Trova tutte le definizioni (separate da <hr>)
  const content = $('#lemma').html() || ''
  const sections = content.split('<hr>')

  sections.forEach((section, index) => {
    const $section = cheerio.load(section)

    // Cerca il numero della definizione e il testo
    const defMatch = $section.html()?.match(/<p><strong>(\d+)\.<\/strong>\s*(.+?)<\/p>/)
    if (!defMatch) return

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

      // Estrai il riferimento alla pagina/colonna
      const riferimentoMatch = citazioneP.match(/(?:colonna|p\.|pp\.|f\.|ff\.)\s*([^,\.]+)/)
      const pagina_riferimento = riferimentoMatch ? riferimentoMatch[0].trim() : undefined

      if (citazione_originale && shorthand_id) {
        ricorrenze.push({
          citazione_originale,
          shorthand_id,
          pagina_riferimento,
        })
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
