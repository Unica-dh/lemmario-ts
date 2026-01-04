/**
 * Script per spostare lemmi da un lemmario all'altro
 * Utile quando la migrazione è stata eseguita con il lemmario sbagliato
 */

import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../packages/payload-cms/.env') })

const moveDataBetweenLemmari = async (fromLemmarioId: number, toLemmarioId: number) => {
  try {
    console.log(`🔄 Inizio spostamento lemmi da lemmario ${fromLemmarioId} a ${toLemmarioId}`)

    // Inizializza Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    })

    // Ricerca tutti i lemmi nel lemmario "da"
    console.log(`📚 Ricerca lemmi nel lemmario ${fromLemmarioId}...`)
    let page = 1
    let totalMoved = 0
    let hasNextPage = true

    while (hasNextPage) {
      const result = await payload.find({
        collection: 'lemmi',
        page,
        limit: 50,
        where: {
          lemmario: {
            equals: fromLemmarioId,
          },
        },
      })

      console.log(`  Pagina ${page}: trovati ${result.docs.length} lemmi`)

      // Sposta ogni lemma
      for (const lemma of result.docs) {
        try {
          await payload.update({
            collection: 'lemmi',
            id: lemma.id,
            data: {
              lemmario: toLemmarioId,
            },
          })
          totalMoved++
          process.stdout.write(`\r  Spostati: ${totalMoved} lemmi`)
        } catch (error) {
          console.error(`  ❌ Errore spostamento lemma ${lemma.id} (${lemma.termine}):`, error)
        }
      }

      hasNextPage = result.hasNextPage
      page++
    }

    console.log(`\n✅ Spostati ${totalMoved} lemmi da lemmario ${fromLemmarioId} a ${toLemmarioId}`)

    // Verifica il risultato
    console.log(`\n📊 Verifica dati:`)
    
    const oldLemmario = await payload.find({
      collection: 'lemmi',
      where: {
        lemmario: {
          equals: fromLemmarioId,
        },
      },
      limit: 1,
    })

    const newLemmario = await payload.find({
      collection: 'lemmi',
      where: {
        lemmario: {
          equals: toLemmarioId,
        },
      },
      limit: 1,
    })

    console.log(`  Lemmi in lemmario ${fromLemmarioId}: ${oldLemmario.totalDocs}`)
    console.log(`  Lemmi in lemmario ${toLemmarioId}: ${newLemmario.totalDocs}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Errore durante lo spostamento:', error)
    process.exit(1)
  }
}

// Esecuzione
const fromId = parseInt(process.env.FROM_LEMMARIO_ID || '2')
const toId = parseInt(process.env.TO_LEMMARIO_ID || '3')

console.log(`Spostamento lemmi da ${fromId} a ${toId}`)
moveDataBetweenLemmari(fromId, toId)
