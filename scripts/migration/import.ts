/**
 * Main migration script
 * Imports data from old_website to Payload CMS
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseBibliografia, parseIndice, convertBiblioToFonte } from './parsers/jsonParser'
import { parseLemmaHTML, extractShorthandIds } from './parsers/htmlParser'
import { MigrationStats, MigrationReport, LemmaImportDetail } from './types'

const API_URL = process.env.API_URL || 'http://localhost:3000/api'
const OLD_WEBSITE_PATH = path.join(__dirname, '../../old_website')
const LEMMARIO_ID = parseInt(process.env.LEMMARIO_ID || '1') // ID del lemmario predefinito

// Mappa per tracciare gli ID delle fonti create
const fontiMap = new Map<string, number>()
// Mappa per tracciare gli ID dei livelli di razionalità (numero -> id)
const livelliMap = new Map<number, number>()

const stats: MigrationStats = {
  fonti: { total: 0, imported: 0, failed: 0, errors: [] },
  lemmi: { total: 0, imported: 0, failed: 0, errors: [] },
  definizioni: { total: 0, imported: 0 },
  ricorrenze: { total: 0, imported: 0 },
  varianti: { total: 0, imported: 0 },
  livelli: { total: 0, loaded: 0 },
}

// Tracking dettagliato per report
const lemmiDetails: LemmaImportDetail[] = []
const fontiMancanti: Set<string> = new Set()
const contenutiIgnoratiGlobali: string[] = []
let startTime: number

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

async function loadLivelliRazionalita() {
  console.log('\n=== FASE 1.5: Caricamento Livelli di Razionalità ===\n')

  try {
    const result = await fetchPayload('/livelli-razionalita?limit=10')
    const livelli = (result as any).docs || []
    
    stats.livelli.total = livelli.length

    if (livelli.length === 0) {
      console.warn('⚠️  ATTENZIONE: Nessun livello di razionalità trovato!')
      console.warn('   Esegui prima: pnpm seed:livelli')
      throw new Error('Livelli di razionalità mancanti')
    }

    for (const livello of livelli) {
      livelliMap.set(livello.numero, livello.id)
      console.log(`✓ Livello ${livello.numero} caricato (ID: ${livello.id})`)
      stats.livelli.loaded++
    }

    console.log(`\n✅ ${livelliMap.size} livelli di razionalità pronti\n`)
  } catch (error) {
    console.error('✗ Errore caricando livelli di razionalità:', error)
    throw error
  }
}

async function importLemmi() {
  console.log('\n=== FASE 2: Import Lemmi ===\n')

  const indicePath = path.join(OLD_WEBSITE_PATH, 'indice.json')
  const indice = parseIndice(indicePath)

  stats.lemmi.total = indice.length

  for (const lemmaEntry of indice) {
    const lemmaDetail: LemmaImportDetail = {
      termine: lemmaEntry.nome,
      tipo: lemmaEntry.tipo,
      status: 'success',
      definizioni_importate: 0,
      ricorrenze_importate: 0,
      varianti_importate: 0,
      contenuto_ignorato: [],
      errori: [],
    }

    try {
      const htmlPath = path.join(OLD_WEBSITE_PATH, 'lemmi', lemmaEntry.file)

      if (!fs.existsSync(htmlPath)) {
        console.warn(`⚠ File non trovato: ${lemmaEntry.file}`)
        stats.lemmi.failed++
        lemmaDetail.status = 'failed'
        lemmaDetail.errori.push(`File non trovato: ${lemmaEntry.file}`)
        lemmiDetails.push(lemmaDetail)
        continue
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      const parsedLemma = parseLemmaHTML(html, lemmaEntry.nome, lemmaEntry.tipo)

      // Traccia contenuto ignorato
      lemmaDetail.contenuto_ignorato = parsedLemma.contenuto_ignorato
      if (parsedLemma.contenuto_ignorato.length > 0) {
        contenutiIgnoratiGlobali.push(...parsedLemma.contenuto_ignorato.map(c => `[${lemmaEntry.nome}] ${c}`))
      }

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
          _status: 'published',
          pubblicato: true,
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
          stats.varianti.imported++
          lemmaDetail.varianti_importate++
        } catch (error) {
          console.warn(`  ⚠ Errore importando variante "${variante}":`, error)
          lemmaDetail.errori.push(`Errore variante "${variante}": ${error}`)
        }
      }
      stats.varianti.total += parsedLemma.varianti.length

      // Aggiungi delay per evitare rate limiting (500ms per gestire limiti stringenti)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Importa definizioni e ricorrenze
      for (const def of parsedLemma.definizioni) {
        try {
          const defData: Record<string, unknown> = {
            lemma: lemmaId,
            numero: def.numero,
            testo: def.testo,
          }
          
          // Associa il livello di razionalità tramite la relazione
          if (def.livello_razionalita) {
            const livelloId = livelliMap.get(def.livello_razionalita)
            if (livelloId) {
              defData.livello_razionalita = livelloId
            } else {
              console.warn(`  ⚠️ Livello ${def.livello_razionalita} non trovato per definizione ${def.numero}`)
            }
          }

          const defResult = await fetchPayload('/definizioni', {
            method: 'POST',
            body: JSON.stringify(defData),
          })

          const defId = (defResult as any).doc.id
          stats.definizioni.imported++
          lemmaDetail.definizioni_importate++

          // Importa ricorrenze per questa definizione
          for (const ric of def.ricorrenze) {
            try {
              const fonteId = fontiMap.get(ric.shorthand_id)

              if (!fonteId) {
                console.warn(`  ⚠ Fonte non trovata per shorthand: ${ric.shorthand_id}`)
                fontiMancanti.add(ric.shorthand_id)
                lemmaDetail.errori.push(`Fonte mancante: ${ric.shorthand_id}`)
                continue
              }

              const ricData = {
                definizione: defId,
                fonte: fonteId,
                testo_originale: ric.citazione_originale,
                note: ric.note_filologiche,
                // Campi riferimento strutturati
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

              stats.ricorrenze.imported++
              lemmaDetail.ricorrenze_importate++
            } catch (error) {
              console.warn(`  ⚠ Errore importando ricorrenza:`, error)
              lemmaDetail.errori.push(`Errore ricorrenza: ${error}`)
            }
          }
        } catch (error) {
          console.warn(`  ⚠ Errore importando definizione ${def.numero}:`, error)
          lemmaDetail.errori.push(`Errore definizione ${def.numero}: ${error}`)
        }
      }

      // Determina lo status finale del lemma
      if (lemmaDetail.errori.length > 0) {
        lemmaDetail.status = 'partial'
      }
      lemmiDetails.push(lemmaDetail)
    } catch (error) {
      console.error(`✗ Errore importando lemma ${lemmaEntry.nome}:`, error)
      stats.lemmi.failed++
      stats.lemmi.errors.push(`${lemmaEntry.nome}: ${error}`)
      lemmaDetail.status = 'failed'
      lemmaDetail.errori.push(`${error}`)
      lemmiDetails.push(lemmaDetail)
    }
  }

  console.log(`\nLemmi: ${stats.lemmi.imported}/${stats.lemmi.total} importati\n`)
}

function generateMarkdownReport(): string {
  const duration = Date.now() - startTime
  const timestamp = new Date().toISOString()

  const report: MigrationReport = {
    timestamp,
    duration_ms: duration,
    summary: stats,
    lemmi_details: lemmiDetails,
    fonti_mancanti: Array.from(fontiMancanti),
    contenuti_ignorati_globali: contenutiIgnoratiGlobali,
  }

  let md = '# Report Migrazione Dati Legacy\n\n'
  md += `**Data**: ${new Date(timestamp).toLocaleString('it-IT')}\n`
  md += `**Durata**: ${(duration / 1000).toFixed(2)} secondi\n\n`
  md += '---\n\n'

  // Riepilogo statistiche
  md += '## 📊 Riepilogo Statistiche\n\n'
  
  md += '### Livelli di Razionalità\n'
  md += `- **Totale**: ${stats.livelli.total}\n`
  md += `- **Caricati**: ${stats.livelli.loaded}\n\n`
  
  md += '### Fonti Bibliografiche\n'
  md += `- **Totale**: ${stats.fonti.total}\n`
  md += `- **Importate**: ${stats.fonti.imported}\n`
  md += `- **Fallite**: ${stats.fonti.failed}\n\n`

  md += '### Lemmi\n'
  md += `- **Totale**: ${stats.lemmi.total}\n`
  md += `- **Importati**: ${stats.lemmi.imported}\n`
  md += `- **Falliti**: ${stats.lemmi.failed}\n\n`

  md += '### Definizioni\n'
  md += `- **Totale**: ${stats.definizioni.imported}\n\n`

  md += '### Ricorrenze\n'
  md += `- **Totale**: ${stats.ricorrenze.imported}\n\n`

  md += '### Varianti Grafiche\n'
  md += `- **Totale**: ${stats.varianti.total}\n`
  md += `- **Importate**: ${stats.varianti.imported}\n\n`

  md += '---\n\n'

  // Fonti mancanti
  if (report.fonti_mancanti.length > 0) {
    md += '## ⚠️ Fonti Mancanti\n\n'
    md += `Le seguenti ${report.fonti_mancanti.length} fonti sono referenziate nei lemmi ma non trovate in bibliografia.json:\n\n`
    report.fonti_mancanti.forEach(fonte => {
      md += `- \`${fonte}\`\n`
    })
    md += '\n---\n\n'
  }

  // Errori Fonti
  if (stats.fonti.errors.length > 0) {
    md += '## ❌ Errori Import Fonti\n\n'
    stats.fonti.errors.forEach(err => {
      md += `- ${err}\n`
    })
    md += '\n---\n\n'
  }

  // Errori Lemmi
  if (stats.lemmi.errors.length > 0) {
    md += '## ❌ Errori Import Lemmi\n\n'
    stats.lemmi.errors.forEach(err => {
      md += `- ${err}\n`
    })
    md += '\n---\n\n'
  }

  // Dettagli per lemma
  md += '## 📝 Dettaglio Importazione per Lemma\n\n'
  md += `Totale lemmi processati: ${lemmiDetails.length}\n\n`

  const lemmiSuccess = lemmiDetails.filter(l => l.status === 'success').length
  const lemmiPartial = lemmiDetails.filter(l => l.status === 'partial').length
  const lemmiFailed = lemmiDetails.filter(l => l.status === 'failed').length

  md += `- ✅ **Successo completo**: ${lemmiSuccess}\n`
  md += `- ⚠️ **Successo parziale** (con errori non bloccanti): ${lemmiPartial}\n`
  md += `- ❌ **Fallito**: ${lemmiFailed}\n\n`

  // Dettaglio lemmi con problemi
  const lemmiConProblemi = lemmiDetails.filter(l => l.status !== 'success' || l.contenuto_ignorato.length > 0)

  if (lemmiConProblemi.length > 0) {
    md += '### Lemmi con Problemi o Contenuto Ignorato\n\n'

    lemmiConProblemi.forEach(lemma => {
      const statusIcon = lemma.status === 'success' ? '✅' : lemma.status === 'partial' ? '⚠️' : '❌'
      md += `#### ${statusIcon} ${lemma.termine} (${lemma.tipo})\n\n`
      md += `- **Status**: ${lemma.status}\n`
      md += `- **Definizioni**: ${lemma.definizioni_importate}\n`
      md += `- **Ricorrenze**: ${lemma.ricorrenze_importate}\n`
      md += `- **Varianti**: ${lemma.varianti_importate}\n`

      if (lemma.errori.length > 0) {
        md += `\n**Errori**:\n`
        lemma.errori.forEach(err => md += `- ${err}\n`)
      }

      if (lemma.contenuto_ignorato.length > 0) {
        md += `\n**Contenuto Ignorato** (${lemma.contenuto_ignorato.length} elementi):\n`
        lemma.contenuto_ignorato.forEach(c => md += `- ${c}\n`)
      }

      md += '\n'
    })
  }

  // Contenuti ignorati globali
  if (contenutiIgnoratiGlobali.length > 0) {
    md += '---\n\n'
    md += '## 🔍 Contenuti Ignorati Globali\n\n'
    md += `Totale contenuti HTML non importati: ${contenutiIgnoratiGlobali.length}\n\n`

    // Raggruppa per tipo
    const riferimentiNonParsati = contenutiIgnoratiGlobali.filter(c => c.includes('Riferimento non parsato'))
    const ricorrenzeIncomplete = contenutiIgnoratiGlobali.filter(c => c.includes('Ricorrenza incompleta'))
    const sezioniIgnorate = contenutiIgnoratiGlobali.filter(c => c.includes('Sezione'))

    if (riferimentiNonParsati.length > 0) {
      md += `### Riferimenti Pagina/Carta Non Parsati (${riferimentiNonParsati.length})\n\n`
      riferimentiNonParsati.slice(0, 50).forEach(c => md += `- ${c}\n`)
      if (riferimentiNonParsati.length > 50) {
        md += `\n... e altri ${riferimentiNonParsati.length - 50} riferimenti\n`
      }
      md += '\n'
    }

    if (ricorrenzeIncomplete.length > 0) {
      md += `### Ricorrenze Incomplete (${ricorrenzeIncomplete.length})\n\n`
      ricorrenzeIncomplete.slice(0, 30).forEach(c => md += `- ${c}\n`)
      if (ricorrenzeIncomplete.length > 30) {
        md += `\n... e altre ${ricorrenzeIncomplete.length - 30} ricorrenze\n`
      }
      md += '\n'
    }

    if (sezioniIgnorate.length > 0) {
      md += `### Sezioni HTML Ignorate (${sezioniIgnorate.length})\n\n`
      sezioniIgnorate.slice(0, 20).forEach(c => md += `- ${c}\n`)
      if (sezioniIgnorate.length > 20) {
        md += `\n... e altre ${sezioniIgnorate.length - 20} sezioni\n`
      }
      md += '\n'
    }
  }

  md += '---\n\n'
  md += `*Report generato automaticamente il ${new Date().toLocaleString('it-IT')}*\n`

  return md
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('RIEPILOGO MIGRAZIONE')
  console.log('='.repeat(60))
  console.log(`\nLivelli:     ${stats.livelli.loaded}/${stats.livelli.total} caricati`)
  console.log(`Fonti:       ${stats.fonti.imported}/${stats.fonti.total} importate (${stats.fonti.failed} errori)`)
  console.log(`Lemmi:       ${stats.lemmi.imported}/${stats.lemmi.total} importati (${stats.lemmi.failed} errori)`)
  console.log(`Definizioni: ${stats.definizioni.imported} importate`)
  console.log(`Ricorrenze:  ${stats.ricorrenze.imported} importate`)
  console.log(`Varianti:    ${stats.varianti.imported}/${stats.varianti.total} importate`)

  if (fontiMancanti.size > 0) {
    console.log(`\n⚠️  Fonti mancanti: ${fontiMancanti.size}`)
  }

  if (contenutiIgnoratiGlobali.length > 0) {
    console.log(`⚠️  Contenuti ignorati: ${contenutiIgnoratiGlobali.length}`)
  }

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

  startTime = Date.now()

  try {
    await importFonti()
    await loadLivelliRazionalita()
    await importLemmi()
    printSummary()

    // Genera e salva report Markdown
    const reportDir = path.join(__dirname, '../../report_migration')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const reportPath = path.join(reportDir, `migration_report_${timestamp}.md`)

    const markdownReport = generateMarkdownReport()
    fs.writeFileSync(reportPath, markdownReport, 'utf-8')

    console.log(`\n📄 Report salvato in: ${reportPath}\n`)
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
