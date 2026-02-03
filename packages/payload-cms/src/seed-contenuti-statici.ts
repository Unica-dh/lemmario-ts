/**
 * Script di seed per contenuti statici
 * Crea pagine di esempio per navigazione Header/Footer
 */
import payload from 'payload'

const seed = async () => {
  console.log('🌱 Inizializzazione contenuti statici...\n')

  // Inizializza Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
    local: true,
  })

  try {
    const contenutiStatici = [
      {
        slug: 'informazioni',
        titolo: 'Informazioni sul progetto',
        contenuto: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h2',
                version: 1,
                children: [{ type: 'text', text: 'Il Progetto Lemmario', version: 1 }],
              },
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Il Lemmario è un dizionario specializzato della terminologia matematica ed economica italiana storica, estratta da statuti e documenti medievali e rinascimentali.',
                    version: 1,
                  },
                ],
              },
            ],
            direction: 'ltr',
          },
        },
        pubblicato: true,
      },
      {
        slug: 'contatti',
        titolo: 'Contatti',
        contenuto: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h2',
                version: 1,
                children: [{ type: 'text', text: 'Contatti', version: 1 }],
              },
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Per informazioni sul progetto Lemmario: info@lemmario.unica.it',
                    version: 1,
                  },
                ],
              },
            ],
            direction: 'ltr',
          },
        },
        pubblicato: true,
      },
      {
        slug: 'guida',
        titolo: "Guida all'uso",
        contenuto: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h2',
                version: 1,
                children: [{ type: 'text', text: "Guida all'uso del Lemmario", version: 1 }],
              },
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Seleziona un dizionario dalla home page, filtra i lemmi per lingua e consulta le definizioni con fonti storiche.',
                    version: 1,
                  },
                ],
              },
            ],
            direction: 'ltr',
          },
        },
        pubblicato: true,
      },
    ]

    console.log('Creazione contenuti statici globali...\n')

    for (const contenuto of contenutiStatici) {
      const existing = await payload.find({
        collection: 'contenuti-statici',
        where: {
          slug: { equals: contenuto.slug },
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'contenuti-statici',
          data: contenuto,
        })
        console.log(`   ✓ Contenuto "${contenuto.titolo}" creato`)
      } else {
        console.log(`   ✓ Contenuto "${contenuto.titolo}" già esistente`)
      }
    }

    console.log('\n✅ Seed contenuti statici completato!')
    console.log('\n📄 Pagine create:')
    contenutiStatici.forEach((c) => {
      console.log(`   - /pagine/${c.slug} - ${c.titolo}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Errore durante il seed:', error)
    process.exit(1)
  }
}

seed()
