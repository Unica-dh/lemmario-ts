/**
 * Test script - imports a single lemma to verify the process
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseLemmaHTML } from './parsers/htmlParser'

const OLD_WEBSITE_PATH = path.join(__dirname, '../../old_website')

// Test parsing di un singolo lemma
const testFile = 'additio.html'
const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', testFile)
const html = fs.readFileSync(htmlPath, 'utf-8')

console.log('=== TEST PARSING LEMMA: additio ===\n')

const parsed = parseLemmaHTML(html, 'additio', 'latino')

console.log('Termine:', parsed.termine)
console.log('Tipo:', parsed.tipo)
console.log('Slug:', parsed.slug)
console.log('\nDefinizioni:', parsed.definizioni.length)

parsed.definizioni.forEach((def) => {
  console.log(`\n--- Definizione ${def.numero} ---`)
  console.log('Testo:', def.testo.substring(0, 100) + '...')
  console.log('Livello razionalità:', def.livello_razionalita)
  console.log('Ricorrenze:', def.ricorrenze.length)

  def.ricorrenze.forEach((ric, j) => {
    console.log(`  Ricorrenza ${j + 1}:`)
    console.log(`    Shorthand: ${ric.shorthand_id}`)
    console.log(`    Citazione: ${ric.citazione_originale.substring(0, 50)}...`)
    console.log(`    Pagina: ${ric.pagina_riferimento || 'N/A'}`)
  })
})

console.log('\n=== TEST COMPLETATO ===\n')
