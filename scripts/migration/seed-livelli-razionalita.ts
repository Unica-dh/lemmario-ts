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
    nome: 'Concetti astratti',
    descrizione: 'Concetti astratti della razionalità economica e matematica',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 2,
    nome: 'Operazioni',
    descrizione: 'Operazioni matematiche e contabili',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 3,
    nome: 'Modi di argomentare',
    descrizione: 'Modi di argomentare e ragionare in ambito economico',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 4,
    nome: 'Elementi tecnici',
    descrizione: 'Elementi tecnici della pratica economica e contabile',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 5,
    nome: 'Giudizi di valore',
    descrizione: 'Giudizi di valore in ambito economico e commerciale',
  },
  {
    lemmario: LEMMARIO_ID,
    numero: 6,
    nome: 'Istituzioni',
    descrizione: 'Istituzioni economiche, commerciali e giuridiche',
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
