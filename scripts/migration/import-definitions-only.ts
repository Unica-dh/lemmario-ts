/**
 * Import ONLY definitions and ricorrenze for already-existing lemmi
 * This script assumes lemmi and fonti are already in the database
 */

import * as path from 'path'
import * as fs from 'fs'
import { parseLemmaHTML } from './parsers/htmlParser'
import { parseIndice } from './parsers/jsonParser'
import { MigrationStats } from './types'

const API_URL = process.env.API_URL || 'http://localhost:3000/api'
const OLD_WEBSITE_PATH = path.join(__dirname, '../../old_website')

// Fetch helper
async function fetchPayload(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function main() {
  console.log('🚀 Importazione definizioni e ricorrenze...\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Old Website Path: ${OLD_WEBSITE_PATH}\n`)

  const stats: Partial<MigrationStats> = {
    definizioni: { total: 0, imported: 0 },
    ricorrenze: { total: 0, imported: 0 },
  }

  // Load indice
  const indicePath = path.join(OLD_WEBSITE_PATH, 'indice.json')
  const indice = parseIndice(indicePath)

  console.log(`\n=== Import Definizioni e Ricorrenze ===\n`)

  let defErrors = 0
  let ricErrors = 0

  for (const lemmaEntry of indice) {
    try {
      const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', lemmaEntry.file)

      if (!fs.existsSync(htmlPath)) {
        console.warn(`⚠ File non trovato: ${lemmaEntry.file}`)
        continue
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      const parsedLemma = parseLemmaHTML(html, lemmaEntry.nome, lemmaEntry.tipo)

      // Find the existing lemma ID
      const lemmiResult = await fetchPayload(
        `/lemmi?where[slug][equals]=${parsedLemma.slug}&limit=1`
      )

      if (!(lemmiResult as any).docs || (lemmiResult as any).docs.length === 0) {
        console.warn(`⚠ Lemma non trovato in DB: ${parsedLemma.termine}`)
        continue
      }

      const lemmaId = (lemmiResult as any).docs[0].id
      console.log(`📖 ${parsedLemma.termine} (ID: ${lemmaId})`)

      // Import definitions
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
          stats.definizioni!.imported++
          console.log(`  ✓ Definizione ${def.numero} (ID: ${defId})`)

          // Import ricorrenze for this definition
          for (const ric of def.ricorrenze) {
            try {
              // Find fonte by shorthand_id
              const fonteResult = await fetchPayload(
                `/fonti?where[shorthand_id][equals]=${ric.shorthand_id}&limit=1`
              )

              if (!(fonteResult as any).docs || (fonteResult as any).docs.length === 0) {
                console.warn(`    ⚠ Fonte non trovata: ${ric.shorthand_id}`)
                continue
              }

              const fonteId = (fonteResult as any).docs[0].id

              const ricData = {
                definizione: defId,
                fonte: fonteId,
                testo_originale: ric.citazione_originale,
                pagina_raw: ric.pagina_raw,
                tipo_riferimento: ric.tipo_riferimento,
                numero: ric.numero,
                numero_secondario: ric.numero_secondario,
                rubrica_numero: ric.rubrica_numero,
                rubrica_titolo: ric.rubrica_titolo,
                libro: ric.libro,
                capitolo: ric.capitolo,
                sezione: ric.sezione,
                supplemento: ric.supplemento,
              }

              await fetchPayload('/ricorrenze', {
                method: 'POST',
                body: JSON.stringify(ricData),
              })

              stats.ricorrenze!.imported++
            } catch (error) {
              ricErrors++
              console.warn(`    ⚠ Errore ricorrenza: ${error}`)
            }
          }
        } catch (error) {
          defErrors++
          console.warn(`  ⚠ Errore definizione ${def.numero}: ${error}`)
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Delay between lemmi
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (error) {
      console.warn(`✗ Errore con lemma ${lemmaEntry.nome}: ${error}`)
    }
  }

  console.log('\n============================================================')
  console.log('RIEPILOGO MIGRAZIONE')
  console.log('============================================================\n')
  console.log(`Definizioni: ${stats.definizioni!.imported} importate (${defErrors} errori)`)
  console.log(`Ricorrenze:  ${stats.ricorrenze!.imported} importate (${ricErrors} errori)`)
  console.log('\n============================================================\n')
}

main().catch(console.error)
