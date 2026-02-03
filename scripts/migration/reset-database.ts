/**
 * Script per resettare il database - ATTENZIONE: ELIMINA TUTTI I DATI!
 * Utilizzare solo in ambiente di sviluppo
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api'

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

async function deleteAllDocs(collection: string, label: string) {
  console.log(`\nEliminazione ${label}...`)
  
  let page = 1
  let hasMore = true
  let totalDeleted = 0

  while (hasMore) {
    try {
      const result = await fetchPayload(`/${collection}?limit=100&page=${page}`)
      const docs = (result as any).docs || []
      
      if (docs.length === 0) {
        hasMore = false
        break
      }

      for (const doc of docs) {
        try {
          await fetchPayload(`/${collection}/${doc.id}`, {
            method: 'DELETE',
          })
          totalDeleted++
          process.stdout.write(`\r  Eliminati: ${totalDeleted}`)
        } catch (error) {
          console.error(`\n  ⚠️ Errore eliminando ${label} ID ${doc.id}:`, error)
        }
      }

      // Se abbiamo ricevuto meno di 100 docs, siamo all'ultima pagina
      if (docs.length < 100) {
        hasMore = false
      } else {
        page++
      }
    } catch (error) {
      console.error(`\n  ❌ Errore recuperando ${label}:`, error)
      hasMore = false
    }
  }

  console.log(`\n✓ ${label}: ${totalDeleted} record eliminati`)
  return totalDeleted
}

async function resetDatabase() {
  console.log('\n' + '='.repeat(60))
  console.log('⚠️  RESET DATABASE - ELIMINAZIONE DATI IN CORSO')
  console.log('='.repeat(60))
  console.log(`\nAPI URL: ${API_URL}\n`)

  const stats = {
    ricorrenze: 0,
    definizioni: 0,
    varianti: 0,
    lemmi: 0,
    fonti: 0,
    livelli: 0,
  }

  try {
    // Elimina in ordine inverso alle dipendenze
    stats.ricorrenze = await deleteAllDocs('ricorrenze', 'Ricorrenze')
    stats.definizioni = await deleteAllDocs('definizioni', 'Definizioni')
    stats.varianti = await deleteAllDocs('varianti-grafiche', 'Varianti Grafiche')
    stats.lemmi = await deleteAllDocs('lemmi', 'Lemmi')
    stats.fonti = await deleteAllDocs('fonti', 'Fonti')
    stats.livelli = await deleteAllDocs('livelli-razionalita', 'Livelli di Razionalità')

    console.log('\n' + '='.repeat(60))
    console.log('RIEPILOGO RESET')
    console.log('='.repeat(60))
    console.log(`Ricorrenze eliminate:          ${stats.ricorrenze}`)
    console.log(`Definizioni eliminate:         ${stats.definizioni}`)
    console.log(`Varianti grafiche eliminate:   ${stats.varianti}`)
    console.log(`Lemmi eliminati:               ${stats.lemmi}`)
    console.log(`Fonti eliminate:               ${stats.fonti}`)
    console.log(`Livelli eliminati:             ${stats.livelli}`)
    console.log('='.repeat(60))
    console.log('\n✅ Database resettato con successo!\n')

  } catch (error) {
    console.error('\n❌ Errore durante il reset:', error)
    process.exit(1)
  }
}

async function main() {
  // Chiedi conferma
  console.log('\n⚠️  ATTENZIONE: Stai per eliminare TUTTI i dati dal database!')
  console.log('Questa operazione è IRREVERSIBILE.\n')
  
  // In produzione, qui dovresti chiedere conferma all'utente
  // Per ora procediamo direttamente (ambiente di sviluppo)
  
  await resetDatabase()
}

if (require.main === module) {
  main().catch(console.error)
}

export { resetDatabase }
