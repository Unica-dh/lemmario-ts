/**
 * Import ONLY ricorrenze for already-existing definitions
 */

import * as path from 'path'
import * as fs from 'fs'
import { parseLemmaHTML } from './parsers/htmlParser'
import { parseIndice } from './parsers/jsonParser'

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
  console.log('🚀 Importazione ricorrenze...\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Old Website Path: ${OLD_WEBSITE_PATH}\n`)

  let ricImported = 0
  let ricErrors = 0

  // Load indice
  const indicePath = path.join(OLD_WEBSITE_PATH, 'indice.json')
  const indice = parseIndice(indicePath)

  console.log(`\n=== Import Ricorrenze ===\n`)

  for (const lemmaEntry of indice) {
    try {
      const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', lemmaEntry.file)

      if (!fs.existsSync(htmlPath)) {
        continue
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      const parsedLemma = parseLemmaHTML(html, lemmaEntry.nome, lemmaEntry.tipo)

      // Find the existing lemma
      const lemmiResult = await fetchPayload(
        `/lemmi?where[slug][equals]=${parsedLemma.slug}&limit=1`
      )

      if (!(lemmiResult as any).docs || (lemmiResult as any).docs.length === 0) {
        continue
      }

      const lemmaId = (lemmiResult as any).docs[0].id

      // Get all definitions for this lemma
      const definizioniResult = await fetchPayload(
        `/definizioni?where[lemma][equals]=${lemmaId}&limit=100`
      )

      if (!(definizioniResult as any).docs || (definizioniResult as any).docs.length === 0) {
        console.warn(`⚠ No definitions found for lemma: ${parsedLemma.termine}`)
        continue
      }

      console.log(`📖 ${parsedLemma.termine} (${(definizioniResult as any).docs.length} defs)`)

      // Create a map of definition number to definition ID
      const defMap = new Map<number, number>()
      for (const def of (definizioniResult as any).docs) {
        defMap.set(def.numero, def.id)
      }

      // Import ricorrenze for each definition
      for (const parsedDef of parsedLemma.definizioni) {
        const defId = defMap.get(parsedDef.numero)
        if (!defId) {
          console.warn(`  ⚠ Definition ${parsedDef.numero} not found in DB`)
          continue
        }

        for (const ric of parsedDef.ricorrenze) {
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
              pagina: ric.pagina_riferimento,
            }

            await fetchPayload('/ricorrenze', {
              method: 'POST',
              body: JSON.stringify(ricData),
            })

            ricImported++
            if (ricImported % 50 === 0) {
              console.log(`  ... ${ricImported} ricorrenze importate`)
            }
          } catch (error) {
            ricErrors++
            if (ricErrors <= 10) {
              console.warn(`    ⚠ Errore ricorrenza: ${error}`)
            }
          }

          // Small delay
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // Delay between lemmi
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.warn(`✗ Errore con lemma ${lemmaEntry.nome}: ${error}`)
    }
  }

  console.log('\n============================================================')
  console.log('RIEPILOGO MIGRAZIONE')
  console.log('============================================================\n')
  console.log(`Ricorrenze:  ${ricImported} importate (${ricErrors} errori)`)
  console.log('\n============================================================\n')
}

main().catch(console.error)
