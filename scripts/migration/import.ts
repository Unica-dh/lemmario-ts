/**
 * Main migration script
 * Imports data from old_website to Payload CMS
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseBibliografia, parseIndice, convertBiblioToFonte } from './parsers/jsonParser'
import { parseLemmaHTML, extractShorthandIds } from './parsers/htmlParser'
import { MigrationStats } from './types'

const API_URL = process.env.API_URL || 'http://localhost:3000/api'
const OLD_WEBSITE_PATH = path.join(__dirname, '../../old_website')
const LEMMARIO_ID = parseInt(process.env.LEMMARIO_ID || '2') // ID del lemmario "Dizionario di Test"

// Mappa per tracciare gli ID delle fonti create
const fontiMap = new Map<string, number>()

const stats: MigrationStats = {
  fonti: { total: 0, imported: 0, failed: 0, errors: [] },
  lemmi: { total: 0, imported: 0, failed: 0, errors: [] },
  definizioni: { total: 0, imported: 0 },
  ricorrenze: { total: 0, imported: 0 },
}

async function fetchPayload(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function importFonti() {
  console.log('\n=== FASE 1: Import Fonti (Bibliografia) ===\n')

  const biblioPath = path.join(OLD_WEBSITE_PATH, 'bibliografia.json')
  const bibliografia = parseBibliografia(biblioPath)

  const shorthandIds = Object.keys(bibliografia)
  stats.fonti.total = shorthandIds.length

  for (const shorthandId of shorthandIds) {
    try {
      const biblio = bibliografia[shorthandId]
      const fonte = convertBiblioToFonte(shorthandId, biblio)

      // Verifica se la fonte esiste già
      const existing = await fetchPayload(
        `/fonti?where[shorthand_id][equals]=${shorthandId}&limit=1`
      )

      let fonteId: number

      if ((existing as any).docs && (existing as any).docs.length > 0) {
        fonteId = (existing as any).docs[0].id
        console.log(`✓ Fonte già esistente: ${shorthandId} (ID: ${fonteId})`)
      } else {
        const result = await fetchPayload('/fonti', {
          method: 'POST',
          body: JSON.stringify(fonte),
        })
        fonteId = (result as any).doc.id
        console.log(`✓ Fonte importata: ${shorthandId} (ID: ${fonteId})`)
        stats.fonti.imported++
      }

      fontiMap.set(shorthandId, fonteId)
    } catch (error) {
      console.error(`✗ Errore importando fonte ${shorthandId}:`, error)
      stats.fonti.failed++
      stats.fonti.errors.push(`${shorthandId}: ${error}`)
    }
  }

  console.log(`\nFonti: ${stats.fonti.imported}/${stats.fonti.total} importate\n`)
}

async function importLemmi() {
  console.log('\n=== FASE 2: Import Lemmi ===\n')

  const indicePath = path.join(OLD_WEBSITE_PATH, 'indice.json')
  const indice = parseIndice(indicePath)

  stats.lemmi.total = indice.length

  for (const lemmaEntry of indice) {
    try {
      const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', lemmaEntry.file)

      if (!fs.existsSync(htmlPath)) {
        console.warn(`⚠ File non trovato: ${lemmaEntry.file}`)
        stats.lemmi.failed++
        continue
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      const parsedLemma = parseLemmaHTML(html, lemmaEntry.nome, lemmaEntry.tipo)

      // Verifica se il lemma esiste già
      const existing = await fetchPayload(
        `/lemmi?where[termine][equals]=${encodeURIComponent(parsedLemma.termine)}&where[tipo][equals]=${parsedLemma.tipo}&limit=1`
      )

      let lemmaId: number

      if ((existing as any).docs && (existing as any).docs.length > 0) {
        lemmaId = (existing as any).docs[0].id
        console.log(`✓ Lemma già esistente: ${parsedLemma.termine} (ID: ${lemmaId})`)
      } else {
        // Crea il lemma
        const lemmaData = {
          termine: parsedLemma.termine,
          tipo: parsedLemma.tipo,
          slug: parsedLemma.slug,
          lemmario: LEMMARIO_ID,
          status: 'published',
        }

        const lemmaResult = await fetchPayload('/lemmi', {
          method: 'POST',
          body: JSON.stringify(lemmaData),
        })

        lemmaId = (lemmaResult as any).doc.id
        console.log(`✓ Lemma importato: ${parsedLemma.termine} (ID: ${lemmaId})`)
        stats.lemmi.imported++
      }

      // Importa varianti grafiche
      for (const variante of parsedLemma.varianti) {
        try {
          await fetchPayload('/varianti-grafiche', {
            method: 'POST',
            body: JSON.stringify({
              lemma: lemmaId,
              variante,
            }),
          })
        } catch (error) {
          console.warn(`  ⚠ Errore importando variante "${variante}":`, error)
        }
      }

      // Aggiungi delay per evitare rate limiting (500ms per gestire limiti stringenti)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Importa definizioni e ricorrenze
      for (const def of parsedLemma.definizioni) {
        try {
          const defData = {
            lemma: lemmaId,
            numero: def.numero,
            testo: def.testo,
          }

          const defResult = await fetchPayload('/definizioni', {
            method: 'POST',
            body: JSON.stringify(defData),
          })

          const defId = (defResult as any).doc.id
          stats.definizioni.imported++

          // Importa ricorrenze per questa definizione
          for (const ric of def.ricorrenze) {
            try {
              const fonteId = fontiMap.get(ric.shorthand_id)

              if (!fonteId) {
                console.warn(`  ⚠ Fonte non trovata per shorthand: ${ric.shorthand_id}`)
                continue
              }

              const ricData = {
                definizione: defId,
                fonte: fonteId,
                citazione_originale: ric.citazione_originale,
                trascrizione_moderna: ric.trascrizione_moderna,
                pagina_riferimento: ric.pagina_riferimento,
                note_filologiche: ric.note_filologiche,
              }

              await fetchPayload('/ricorrenze', {
                method: 'POST',
                body: JSON.stringify(ricData),
              })

              stats.ricorrenze.imported++
            } catch (error) {
              console.warn(`  ⚠ Errore importando ricorrenza:`, error)
            }
          }
        } catch (error) {
          console.warn(`  ⚠ Errore importando definizione ${def.numero}:`, error)
        }
      }
    } catch (error) {
      console.error(`✗ Errore importando lemma ${lemmaEntry.nome}:`, error)
      stats.lemmi.failed++
      stats.lemmi.errors.push(`${lemmaEntry.nome}: ${error}`)
    }
  }

  console.log(`\nLemmi: ${stats.lemmi.imported}/${stats.lemmi.total} importati\n`)
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('RIEPILOGO MIGRAZIONE')
  console.log('='.repeat(60))
  console.log(`\nFonti:       ${stats.fonti.imported}/${stats.fonti.total} importate (${stats.fonti.failed} errori)`)
  console.log(`Lemmi:       ${stats.lemmi.imported}/${stats.lemmi.total} importati (${stats.lemmi.failed} errori)`)
  console.log(`Definizioni: ${stats.definizioni.imported} importate`)
  console.log(`Ricorrenze:  ${stats.ricorrenze.imported} importate`)

  if (stats.fonti.errors.length > 0) {
    console.log('\n--- Errori Fonti ---')
    stats.fonti.errors.slice(0, 10).forEach(err => console.log('  -', err))
    if (stats.fonti.errors.length > 10) {
      console.log(`  ... e altri ${stats.fonti.errors.length - 10} errori`)
    }
  }

  if (stats.lemmi.errors.length > 0) {
    console.log('\n--- Errori Lemmi ---')
    stats.lemmi.errors.slice(0, 10).forEach(err => console.log('  -', err))
    if (stats.lemmi.errors.length > 10) {
      console.log(`  ... e altri ${stats.lemmi.errors.length - 10} errori`)
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

async function main() {
  console.log('🚀 Inizio migrazione dati legacy...\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Lemmario ID: ${LEMMARIO_ID}`)
  console.log(`Old Website Path: ${OLD_WEBSITE_PATH}\n`)

  try {
    await importFonti()
    await importLemmi()
    printSummary()
  } catch (error) {
    console.error('\n❌ Errore fatale durante la migrazione:', error)
    process.exit(1)
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  main().catch(console.error)
}

export { importFonti, importLemmi, stats }
