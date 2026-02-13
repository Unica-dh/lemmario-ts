/**
 * Test script to verify all parser fixes work correctly.
 * Tests the specific lemmi that were previously failing.
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseLemmaHTML, extractShorthandIds, extractCrossReferences } from './parsers/htmlParser'
import { parseBibliografia } from './parsers/jsonParser'

const OLD_WEBSITE_PATH = path.join(__dirname, '../../old_website')

interface TestResult {
  termine: string
  tipo: 'volgare' | 'latino'
  definizioni: number
  ricorrenze: number
  contenuto_ignorato: number
  passed: boolean
  details: string[]
}

const results: TestResult[] = []
let totalTests = 0
let passedTests = 0

function testLemma(
  file: string,
  termine: string,
  tipo: 'volgare' | 'latino',
  expectedDefs: number,
  expectedRic: number,
  maxIgnorato: number,
  description: string
) {
  totalTests++
  const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', file)
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const parsed = parseLemmaHTML(html, termine, tipo)

  const details: string[] = []
  let passed = true

  if (parsed.definizioni.length < expectedDefs) {
    details.push(`FAIL: Attese >= ${expectedDefs} definizioni, ottenute ${parsed.definizioni.length}`)
    passed = false
  } else {
    details.push(`OK: ${parsed.definizioni.length} definizioni (attese >= ${expectedDefs})`)
  }

  const totalRic = parsed.definizioni.reduce((sum, d) => sum + d.ricorrenze.length, 0)
  if (totalRic < expectedRic) {
    details.push(`FAIL: Attese >= ${expectedRic} ricorrenze, ottenute ${totalRic}`)
    passed = false
  } else {
    details.push(`OK: ${totalRic} ricorrenze (attese >= ${expectedRic})`)
  }

  if (parsed.contenuto_ignorato.length > maxIgnorato) {
    details.push(`WARN: ${parsed.contenuto_ignorato.length} contenuti ignorati (max atteso ${maxIgnorato})`)
    parsed.contenuto_ignorato.forEach(c => details.push(`  - ${c}`))
  } else {
    details.push(`OK: ${parsed.contenuto_ignorato.length} contenuti ignorati (max ${maxIgnorato})`)
  }

  if (passed) passedTests++

  results.push({
    termine,
    tipo,
    definizioni: parsed.definizioni.length,
    ricorrenze: totalRic,
    contenuto_ignorato: parsed.contenuto_ignorato.length,
    passed,
    details,
  })

  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${description}: ${termine} (${tipo})`)
  if (!passed) {
    details.forEach(d => console.log(`   ${d}`))
  }
}

console.log('=' .repeat(60))
console.log('TEST PARSER MIGLIORATO - VERIFICA FIX')
console.log('=' .repeat(60))
console.log()

// ===== BUG 1: Multiline definition regex =====
console.log('--- FIX 1: Regex multilinea definizioni ---')

testLemma('aequalitas.html', 'Aequalitas', 'latino', 1, 5, 0,
  'Definizione multilinea (aequalitas)')

testLemma('aggiungere.html', 'Aggiungere', 'volgare', 2, 3, 0,
  'Due definizioni multilinea (aggiungere)')

testLemma('cambium.html', 'Cambium', 'latino', 1, 0, 0,
  'Definizione con cfr (cambium)')

testLemma('emendare_lat.html', 'Emendare', 'latino', 1, 0, 0,
  'Definizione prima di hr (emendare)')

testLemma('sconto.html', 'Sconto', 'volgare', 1, 0, 0,
  'Definizione con testo quoted (sconto)')

testLemma('stimare.html', 'Stimare', 'volgare', 1, 0, 0,
  'Definizione prima sezione (stimare)')

console.log()

// ===== BUG 2: HTML malformation =====
console.log('--- FIX 2: HTML malformato ---')

testLemma('partire.html', 'Partire', 'volgare', 3, 4, 0,
  'Tag <p> malformato alla def 3 (partire)')

console.log()

// ===== BUG 3: Empty definition text =====
console.log('--- FIX 3: Definizione vuota ---')

testLemma('exceptio.html', 'Exceptio', 'latino', 2, 4, 1,
  'Def 2 testo vuoto con placeholder (exceptio)')

console.log()

// ===== BUG 4: Multiple citations per li =====
console.log('--- FIX 4: Citazioni multiple per <li> ---')

// aequalitas has 2 li with 2+3 = 5 citations in multiple <p> tags
testLemma('aequalitas.html', 'Aequalitas', 'latino', 1, 5, 0,
  'Multiple <p> per <li> (aequalitas)')

console.log()

// ===== BUG 5: Multiline citation regex =====
console.log('--- FIX 5: Citazioni multilinea ---')

testLemma('ingegno.html', 'Ingegno', 'volgare', 4, 5, 0,
  'Citazione multilinea def 4 (ingegno)')

console.log()

// ===== BUG 6: Reference patterns =====
console.log('--- FIX 6: Pattern riferimenti ---')

testLemma('forma_volg.html', 'Forma', 'volgare', 6, 6, 1,
  'Sei definizioni volgare (forma_volg)')

// forma.html (latino) ha citazioni troncate nel sorgente - è previsto
testLemma('forma.html', 'Forma', 'latino', 1, 5, 6,
  'Latino con citazioni troncate (forma - dati sorgente incompleti)')

console.log()

// ===== Additional tests: previously partially parsed lemmi =====
console.log('--- Test aggiuntivi: lemmi con parsing parziale ---')

testLemma('camerarius.html', 'Camerarius', 'latino', 2, 4, 0,
  'Due definizioni (camerarius)')

testLemma('capitale_lat.html', 'Capitale', 'latino', 2, 2, 0,
  'Due definizioni (capitale)')

testLemma('compensatio.html', 'Compensatio', 'latino', 2, 3, 0,
  'Due definizioni separate da hr (compensatio)')

testLemma('trarre.html', 'Trarre', 'volgare', 13, 13, 0,
  'Tredici definizioni (trarre)')

testLemma('termine.html', 'Termine', 'volgare', 8, 8, 0,
  'Otto definizioni (termine)')

testLemma('usura_volg.html', 'Usura', 'volgare', 2, 2, 0,
  'Due definizioni (usura volgare)')

console.log()

// ===== Test fonti mancanti =====
console.log('--- FIX 7: Fonti mancanti in bibliografia.json ---')

const biblioPath = path.join(OLD_WEBSITE_PATH, 'bibliografia.json')
const biblio = parseBibliografia(biblioPath)

const missingFonti = ['Stat.Rigattieri', 'Stat.Correggiai', 'Memoriale_abacho']
missingFonti.forEach(fonte => {
  totalTests++
  if (biblio[fonte]) {
    passedTests++
    console.log(`✅ Fonte presente: ${fonte} -> "${biblio[fonte].title}"`)
  } else {
    console.log(`❌ Fonte mancante: ${fonte}`)
  }
})

console.log()

// ===== FIX 9: Varianti grafiche =====
console.log('--- FIX 9: Varianti grafiche dal titolo ---')

// Test positivo: libra,_livra.html → variante "Livra"
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'libra,_livra.html'), 'utf-8')
  const parsed = parseLemmaHTML(html, 'libra', 'volgare')
  if (parsed.varianti.length === 1 && parsed.varianti[0] === 'Livra') {
    passedTests++
    console.log(`✅ libra,_livra.html -> 1 variante "Livra"`)
  } else {
    console.log(`❌ libra,_livra.html: attesa 1 variante "Livra", ottenute ${parsed.varianti.length}: ${JSON.stringify(parsed.varianti)}`)
  }
}

// Test positivo: osservagione,_osservazione.html → variante "Osservazione"
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'osservagione,_osservazione.html'), 'utf-8')
  const parsed = parseLemmaHTML(html, 'observagione', 'volgare')
  if (parsed.varianti.length === 1 && parsed.varianti[0] === 'Osservazione') {
    passedTests++
    console.log(`✅ osservagione,_osservazione.html -> 1 variante "Osservazione"`)
  } else {
    console.log(`❌ osservagione,_osservazione.html: attesa 1 variante "Osservazione", ottenute ${parsed.varianti.length}: ${JSON.stringify(parsed.varianti)}`)
  }
}

// Test negativo: forma.html (latino con CFR nel titolo) → 0 varianti
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'forma.html'), 'utf-8')
  const parsed = parseLemmaHTML(html, 'forma', 'latino')
  if (parsed.varianti.length === 0) {
    passedTests++
    console.log(`✅ forma.html -> 0 varianti (CFR nel titolo non conta)`)
  } else {
    console.log(`❌ forma.html: attese 0 varianti, ottenute ${parsed.varianti.length}: ${JSON.stringify(parsed.varianti)}`)
  }
}

// Test negativo: algebra.html (titolo semplice) → 0 varianti
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'algebra.html'), 'utf-8')
  const parsed = parseLemmaHTML(html, 'algebra', 'volgare')
  if (parsed.varianti.length === 0) {
    passedTests++
    console.log(`✅ algebra.html -> 0 varianti (titolo semplice)`)
  } else {
    console.log(`❌ algebra.html: attese 0 varianti, ottenute ${parsed.varianti.length}: ${JSON.stringify(parsed.varianti)}`)
  }
}

console.log()

// Carica indice per scansioni globali (CFR + statistiche)
const indicePath = path.join(OLD_WEBSITE_PATH, 'indice.json')
const indice = JSON.parse(fs.readFileSync(indicePath, 'utf-8')).lemmi as Array<{nome: string, tipo: 'volgare' | 'latino', file: string}>

// ===== FIX 8: Cross-references (CFR) =====
console.log('--- FIX 8: Riferimenti incrociati (CFR) ---')

// Test 1: camera_lat.html -> camera_volg.html
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'camera_lat.html'), 'utf-8')
  const refs = extractCrossReferences(html)
  if (refs.length === 1 && refs[0].target_filename === 'camera_volg.html') {
    passedTests++
    console.log(`✅ camera_lat.html -> 1 CFR verso camera_volg.html`)
  } else {
    console.log(`❌ camera_lat.html: atteso 1 CFR verso camera_volg.html, ottenuto ${JSON.stringify(refs)}`)
  }
}

// Test 2: algebra.html -> nessun CFR
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'algebra.html'), 'utf-8')
  const refs = extractCrossReferences(html)
  if (refs.length === 0) {
    passedTests++
    console.log(`✅ algebra.html -> 0 CFR (atteso)`)
  } else {
    console.log(`❌ algebra.html: atteso 0 CFR, ottenuto ${refs.length}`)
  }
}

// Test 3: cambio.html -> cambium.html con prefisso lat.
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'cambio.html'), 'utf-8')
  const refs = extractCrossReferences(html)
  if (refs.length === 1 && refs[0].target_filename === 'cambium.html' && refs[0].language_prefix === 'lat.') {
    passedTests++
    console.log(`✅ cambio.html -> 1 CFR verso cambium.html (lat.)`)
  } else {
    console.log(`❌ cambio.html: atteso 1 CFR verso cambium.html lat., ottenuto ${JSON.stringify(refs)}`)
  }
}

// Test 4: parseLemmaHTML integra i CFR
totalTests++
{
  const html = fs.readFileSync(path.join(OLD_WEBSITE_PATH, 'lemmi', 'usura_volg.html'), 'utf-8')
  const parsed = parseLemmaHTML(html, 'Usura', 'volgare')
  if (parsed.riferimenti_incrociati.length === 1 && parsed.riferimenti_incrociati[0].target_filename === 'usura_lat.html') {
    passedTests++
    console.log(`✅ usura_volg.html parseLemmaHTML -> 1 CFR integrato`)
  } else {
    console.log(`❌ usura_volg.html parseLemmaHTML: atteso 1 CFR, ottenuto ${parsed.riferimenti_incrociati.length}`)
  }
}

console.log()

// Scansione completa CFR
console.log('--- SCANSIONE CFR: Conteggio globale ---')
{
  const indiceFileSet = new Set(indice.map((e: { file: string }) => e.file))
  let totalCfr = 0
  let cfrWithMissingTarget = 0
  let filesWithCfr = 0

  for (const entry of indice) {
    const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', entry.file)
    if (!fs.existsSync(htmlPath)) continue
    const html = fs.readFileSync(htmlPath, 'utf-8')
    const refs = extractCrossReferences(html)
    totalCfr += refs.length
    if (refs.length > 0) filesWithCfr++
    for (const ref of refs) {
      if (!indiceFileSet.has(ref.target_filename)) {
        cfrWithMissingTarget++
        console.log(`  ⚠️  Target mancante da indice: ${entry.file} -> ${ref.target_filename}`)
      }
    }
  }

  console.log(`File con CFR: ${filesWithCfr}`)
  console.log(`Riferimenti CFR totali: ${totalCfr}`)
  console.log(`Target mancanti da indice.json: ${cfrWithMissingTarget}`)
  console.log(`Coppie uniche attese: ~${Math.floor((totalCfr - cfrWithMissingTarget) / 2)}`)
}

console.log()

// ===== Full scan: count all definitions and ricorrenze =====
console.log('--- SCANSIONE COMPLETA: Statistiche globali ---')

let totalDef = 0
let totalRic = 0
let totalIgnorato = 0
let totalVarianti = 0
let lemmiWithIgnorato = 0
let lemmiWithVarianti = 0

for (const entry of indice) {
  const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', entry.file)
  if (!fs.existsSync(htmlPath)) continue

  const html = fs.readFileSync(htmlPath, 'utf-8')
  const parsed = parseLemmaHTML(html, entry.nome, entry.tipo)

  totalDef += parsed.definizioni.length
  totalRic += parsed.definizioni.reduce((sum, d) => sum + d.ricorrenze.length, 0)
  totalIgnorato += parsed.contenuto_ignorato.length
  totalVarianti += parsed.varianti.length
  if (parsed.contenuto_ignorato.length > 0) lemmiWithIgnorato++
  if (parsed.varianti.length > 0) lemmiWithVarianti++
}

console.log(`Lemmi totali processati: ${indice.length}`)
console.log(`Definizioni totali: ${totalDef} (prima: 430)`)
console.log(`Ricorrenze totali: ${totalRic} (prima: 555)`)
console.log(`Varianti grafiche totali: ${totalVarianti} (lemmi con varianti: ${lemmiWithVarianti})`)
console.log(`Contenuti ignorati: ${totalIgnorato} (prima: 33)`)
console.log(`Lemmi con contenuto ignorato: ${lemmiWithIgnorato}`)

console.log()
console.log('=' .repeat(60))
console.log(`RISULTATO: ${passedTests}/${totalTests} test superati`)
console.log('=' .repeat(60))

if (passedTests < totalTests) {
  console.log('\n⚠️  Alcuni test sono falliti. Dettagli:')
  results.filter(r => !r.passed).forEach(r => {
    console.log(`\n❌ ${r.termine} (${r.tipo}):`)
    r.details.forEach(d => console.log(`   ${d}`))
  })
}
