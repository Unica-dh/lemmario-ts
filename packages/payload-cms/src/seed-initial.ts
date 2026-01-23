/**
 * Script di seed iniziale per creare dati di base
 */
import payload from 'payload'

const seed = async () => {
  console.log('🌱 Inizializzazione dati di base...\n')

  // Inizializza Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
    local: true,
  })

  try {
    // 1. Crea utente super admin
    console.log('1. Creazione utente super admin...')
    const existingUsers = await payload.find({
      collection: 'utenti',
      limit: 1,
    })

    let adminUser
    if (existingUsers.docs.length === 0) {
      adminUser = await payload.create({
        collection: 'utenti',
        data: {
          email: 'admin@lemmario.test',
          password: 'admin123',
          nome: 'Admin',
          cognome: 'System',
          ruolo_globale: 'super_admin',
        },
      })
      console.log(`   ✓ Utente admin creato: ${adminUser.email}`)
    } else {
      adminUser = existingUsers.docs[0]
      console.log(`   ✓ Utente admin già esistente: ${adminUser.email}`)
    }

    // 2. Crea lemmario "Dizionario di Test"
    console.log('\n2. Creazione lemmario "Dizionario di Test"...')
    const existingLemmari = await payload.find({
      collection: 'lemmari',
      where: {
        slug: { equals: 'test' },
      },
      limit: 1,
    })

    let lemmario
    if (existingLemmari.docs.length === 0) {
      lemmario = await payload.create({
        collection: 'lemmari',
        data: {
          titolo: 'Dizionario di Test',
          slug: 'test',
          descrizione: 'Dizionario di test per sviluppo e migrazione dati legacy',
          attivo: true,
        },
      })
      console.log(`   ✓ Lemmario creato con ID: ${lemmario.id}`)
    } else {
      lemmario = existingLemmari.docs[0]
      console.log(`   ✓ Lemmario già esistente con ID: ${lemmario.id}`)
    }

    // 3. Assegna ruolo admin al lemmario
    console.log('\n3. Assegnazione ruolo admin al lemmario...')
    const existingAssignment = await payload.find({
      collection: 'utenti-ruoli-lemmari',
      where: {
        utente: { equals: adminUser.id },
        lemmario: { equals: lemmario.id },
      },
      limit: 1,
    })

    if (existingAssignment.docs.length === 0) {
      await payload.create({
        collection: 'utenti-ruoli-lemmari',
        data: {
          utente: adminUser.id,
          lemmario: lemmario.id,
          ruolo: 'lemmario_admin',
        },
      })
      console.log('   ✓ Ruolo admin assegnato')
    } else {
      console.log('   ✓ Ruolo già assegnato')
    }

    // 4. Crea livelli di razionalità (1-6)
    console.log('\n4. Creazione livelli di razionalità...')
    const livelli = [
      { numero: 1, nome: 'Livello 1', descrizione: 'Primo livello di razionalità' },
      { numero: 2, nome: 'Livello 2', descrizione: 'Secondo livello di razionalità' },
      { numero: 3, nome: 'Livello 3', descrizione: 'Terzo livello di razionalità' },
      { numero: 4, nome: 'Livello 4', descrizione: 'Quarto livello di razionalità' },
      { numero: 5, nome: 'Livello 5', descrizione: 'Quinto livello di razionalità' },
      { numero: 6, nome: 'Livello 6', descrizione: 'Sesto livello di razionalità' },
    ]

    for (const livello of livelli) {
      const existing = await payload.find({
        collection: 'livelli-razionalita',
        where: {
          lemmario: { equals: lemmario.id },
          numero: { equals: livello.numero },
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'livelli-razionalita',
          data: {
            lemmario: lemmario.id,
            ...livello,
          },
        })
        console.log(`   ✓ Livello ${livello.numero} creato`)
      } else {
        console.log(`   ✓ Livello ${livello.numero} già esistente`)
      }
    }

    console.log('\n✅ Seed completato con successo!')
    console.log(`\n📝 Credenziali admin:`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: admin123`)
    console.log(`\n📚 Lemmario ID: ${lemmario.id}`)
    console.log(`\n🌐 Admin URL: http://localhost:3000/admin`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Errore durante il seed:', error)
    process.exit(1)
  }
}

seed()
