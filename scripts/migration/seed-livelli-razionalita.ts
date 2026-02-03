/**
 * Script per popolare i Livelli di Razionalità
 * Deve essere eseguito PRIMA dell'importazione principale
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api'
const LEMMARIO_ID = parseInt(process.env.LEMMARIO_ID || '1')

const livelliRazionalita = [
  {
    lemmario: LEMMARIO_ID,
    numero: 1,
    nome: 'Livello 1 - Termine del lessico economico',
    descrizione: 'Termine appartenente al lessico economico di base',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 2,
    nome: 'Livello 2 - Termine con accezione economica specifica',
    descrizione: 'Termine con significato economico specifico nel contesto',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 3,
    nome: 'Livello 3 - Termine con accezione economica nel contesto',
    descrizione: 'Termine che acquisisce significato economico nel contesto specifico',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 4,
    nome: 'Livello 4 - Termine con possibile accezione economica',
    descrizione: 'Termine con possibile interpretazione economica',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 5,
    nome: 'Livello 5 - Termine borderline',
    descrizione: 'Termine al confine tra lessico economico e altri ambiti',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 6,
    nome: 'Livello 6 - Termine non economico ma rilevante',
    descrizione: 'Termine non propriamente economico ma rilevante per il contesto',
  },
]

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

async function seedLivelliRazionalita() {
  console.log('\n=== Popolamento Livelli di Razionalità ===\n')

  const livelliMap = new Map<number, number>() // numero -> id

  for (const livello of livelliRazionalita) {
    try {
      // Verifica se il livello esiste già
      const existing = await fetchPayload(
        `/livelli-razionalita?where[numero][equals]=${livello.numero}&where[lemmario][equals]=${LEMMARIO_ID}&limit=1`
      )

      let livelloId: number

      if ((existing as any).docs && (existing as any).docs.length > 0) {
        livelloId = (existing as any).docs[0].id
        console.log(`✓ Livello ${livello.numero} già esistente (ID: ${livelloId})`)
      } else {
        const result = await fetchPayload('/livelli-razionalita', {
          method: 'POST',
          body: JSON.stringify(livello),
        })
        livelloId = (result as any).doc.id
        console.log(`✓ Livello ${livello.numero} creato (ID: ${livelloId})`)
      }

      livelliMap.set(livello.numero, livelloId)
    } catch (error) {
      console.error(`✗ Errore creando livello ${livello.numero}:`, error)
      throw error
    }
  }

  console.log(`\n✅ ${livelliMap.size}/${livelliRazionalita.length} livelli pronti\n`)
  return livelliMap
}

async function main() {
  console.log('🚀 Inizializzazione Livelli di Razionalità...\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Lemmario ID: ${LEMMARIO_ID}\n`)

  try {
    await seedLivelliRazionalita()
    console.log('✅ Completato!\n')
  } catch (error) {
    console.error('\n❌ Errore fatale:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { seedLivelliRazionalita }
