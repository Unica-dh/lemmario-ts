/**
 * Script di seed per popolare il database con dati iniziali
 * 
 * Crea:
 * - Utente admin
 * - Lemmario di default
 * - Livelli di razionalità (1-6)
 * - Ruolo admin per l'utente sul lemmario
 */

import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'

// Carica variabili d'ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const seed = async () => {
  try {
    console.log('🌱 Inizializzazione seed database...')

    // Inizializza Payload con local flag (no express)
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    })

    console.log('✅ Payload inizializzato')

    // 1. Crea utente admin
    console.log('👤 Creazione utente admin...')
    
    const existingUsers = await payload.find({
      collection: 'utenti',
      where: {
        email: {
          equals: 'admin@lemmario.dev',
        },
      },
      limit: 1,
    })

    let adminUser
    if (existingUsers.docs.length > 0) {
      console.log('  ℹ️  Utente admin già esistente')
      adminUser = existingUsers.docs[0]
    } else {
      adminUser = await payload.create({
        collection: 'utenti',
        data: {
          email: 'admin@lemmario.dev',
          password: 'password',
          nome: 'Admin',
          cognome: 'Sistema',
          ruolo_globale: 'super_admin',
        },
      })
      console.log('  ✅ Utente admin creato (email: admin@lemmario.dev, password: password)')
    }

    // 2. Crea lemmario di default
    console.log('📚 Creazione lemmario...')
    
    const existingLemmari = await payload.find({
      collection: 'lemmari',
      where: {
        slug: {
          equals: 'lemmario-ragioneria',
        },
      },
      limit: 1,
    })

    let lemmario
    if (existingLemmari.docs.length > 0) {
      console.log('  ℹ️  Lemmario già esistente')
      lemmario = existingLemmari.docs[0]
    } else {
      lemmario = await payload.create({
        collection: 'lemmari',
        data: {
          titolo: 'Lemmario della Ragioneria Medievale',
          slug: 'lemmario-ragioneria',
          sottotitolo: 'Terminologia mercantile e contabile medievale',
          descrizione: 'Lemmario storico della terminologia mercantile e contabile medievale italiana',
          attivo: true,
          periodo_storico: 'XIII-XV secolo',
          curatori: 'Centro di ricerca in Storia della ragioneria',
        },
      })
      console.log(`  ✅ Lemmario creato (ID: ${lemmario.id})`)
    }

    // 3. Crea livelli di razionalità
    console.log('📊 Creazione livelli di razionalità...')
    
    const livelli = [
      { numero: 1, nome: 'Livello 1 - Operazioni', descrizione: 'Operazioni matematiche fondamentali' },
      { numero: 2, nome: 'Livello 2 - Elementi tecnici', descrizione: 'Elementi tecnici e strumenti' },
      { numero: 3, nome: 'Livello 3 - Concetti', descrizione: 'Concetti astratti' },
      { numero: 4, nome: 'Livello 4 - Teorie', descrizione: 'Teorie e sistemi complessi' },
    ]

    for (const livello of livelli) {
      const existing = await payload.find({
        collection: 'livelli-razionalita',
        where: {
          and: [
            {
              numero: {
                equals: livello.numero,
              },
            },
            {
              lemmario: {
                equals: lemmario.id,
              },
            },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'livelli-razionalita',
          data: {
            ...livello,
            lemmario: lemmario.id,
          },
        })
        console.log(`  ✅ Livello ${livello.numero} creato`)
      } else {
        console.log(`  ℹ️  Livello ${livello.numero} già esistente`)
      }
    }

    // 4. Assegna ruolo admin all'utente sul lemmario
    console.log('🔐 Assegnazione ruolo admin...')
    
    const existingRoles = await payload.find({
      collection: 'utenti-ruoli-lemmari',
      where: {
        and: [
          {
            utente: {
              equals: adminUser.id,
            },
          },
          {
            lemmario: {
              equals: lemmario.id,
            },
          },
        ],
      },
      limit: 1,
    })

    if (existingRoles.docs.length === 0) {
      await payload.create({
        collection: 'utenti-ruoli-lemmari',
        data: {
          utente: adminUser.id,
          lemmario: lemmario.id,
          ruolo: 'lemmario_admin',
        },
      })
      console.log('  ✅ Ruolo lemmario_admin assegnato')
    } else {
      console.log('  ℹ️  Ruolo lemmario_admin già assegnato')
    }

    console.log('\n🎉 Seed completato con successo!')
    console.log('\nCredenziali accesso:')
    console.log('  Email: admin@lemmario.dev')
    console.log('  Password: password')
    console.log(`  Lemmario ID: ${lemmario.id}`)
    console.log('\nAccedi a: http://localhost:3000/admin')

    process.exit(0)
  } catch (error) {
    console.error('❌ Errore durante il seed:', error)
    process.exit(1)
  }
}

seed()
