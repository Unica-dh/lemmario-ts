/**
 * Script: Sdoppiamento fonte "Statuti della Repubblica Fiorentina"
 *
 * Task 4 - fix_27.02.md
 *
 * La fonte "Firenze.Statuti.1355.volg" accorpa due manoscritti distinti:
 * - Statuto del Capitano del Popolo (citazioni con prefisso "c.")
 * - Statuto del Podestà (citazioni con prefisso "p.")
 *
 * Questo script:
 * 1. Crea 2 nuove fonti (.C e .P)
 * 2. Riassegna le ricorrenze in base al prefisso pagina_raw
 * 3. Elimina la fonte originale
 *
 * Usage:
 *   API_URL=http://localhost:3000/api \
 *   MIGRATION_EMAIL=admin@lemmario.dev \
 *   MIGRATION_PASSWORD=password \
 *   npx ts-node migration/split-fonte-statuti.ts
 *
 *   Aggiungere DRY_RUN=1 per simulare senza modifiche.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api'
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL || ''
const MIGRATION_PASSWORD = process.env.MIGRATION_PASSWORD || ''
const DRY_RUN = process.env.DRY_RUN === '1'

const ORIGINAL_SHORTHAND = 'Firenze.Statuti.1355.volg'

const NUOVE_FONTI = {
  C: {
    shorthand_id: 'Firenze.Statuti.1355.volg.C',
    titolo: 'Statuti della Repubblica fiorentina',
    anno: '1355',
    riferimento_completo:
      'Gli statuti della Repubblica fiorentina del 1355 in volgare, a cura di Federigo Bambi, Francesco Salvestrini, Lorenzo Tanzini, 3: Indici, a cura di Federigo Bambi e Piero Gualtieri, Firenze, Olschki, 2023.',
  },
  P: {
    shorthand_id: 'Firenze.Statuti.1355.volg.P',
    titolo: 'Statuti della Repubblica fiorentina',
    anno: '1355',
    riferimento_completo:
      'Gli statuti della Repubblica fiorentina del 1355 in volgare, a cura di Federigo Bambi, Francesco Salvestrini, Lorenzo Tanzini, 3: Indici, a cura di Federigo Bambi e Piero Gualtieri, Firenze, Olschki, 2023.',
  },
}

/** Mapping prefisso pagina_raw → nuova etichetta */
const PAGINA_RAW_REWRITE: Record<string, { prefix: string; replacement: string }> = {
  C: { prefix: 'c.', replacement: 'Capitano.' },
  P: { prefix: 'p.', replacement: 'Podestà.' },
}

let authToken: string | null = null

interface PayloadDoc {
  id: number
  [key: string]: unknown
}

interface PayloadResponse {
  docs: PayloadDoc[]
  totalDocs: number
}

async function login(): Promise<void> {
  if (!MIGRATION_EMAIL || !MIGRATION_PASSWORD) {
    throw new Error('MIGRATION_EMAIL e MIGRATION_PASSWORD sono obbligatorie')
  }

  console.log(`🔐 Login come ${MIGRATION_EMAIL}...`)
  const response = await fetch(`${API_URL}/utenti/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: MIGRATION_EMAIL, password: MIGRATION_PASSWORD }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Login fallito: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as { token?: string }
  authToken = data.token || null

  if (!authToken) {
    throw new Error('Login riuscito ma nessun token ricevuto')
  }

  console.log('✅ Login riuscito\n')
}

async function fetchAPI(endpoint: string, options?: RequestInit): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (authToken) {
    headers['Authorization'] = `JWT ${authToken}`
  }

  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error ${response.status} on ${options?.method || 'GET'} ${endpoint}: ${error}`)
  }

  return response.json()
}

function rewritePaginaRaw(paginaRaw: string, tipo: 'C' | 'P'): string {
  const { prefix, replacement } = PAGINA_RAW_REWRITE[tipo]
  const trimmed = paginaRaw.trim()

  // "c. 42v." → "Capitano. 42v." / "p. 15v." → "Podestà. 15v."
  if (trimmed.startsWith(prefix + ' ')) {
    return replacement + ' ' + trimmed.slice(prefix.length + 1)
  }
  if (trimmed.startsWith(prefix)) {
    return replacement + trimmed.slice(prefix.length)
  }

  return trimmed
}

function classificaRicorrenza(paginaRaw: string): 'C' | 'P' | null {
  const trimmed = (paginaRaw || '').trim()

  if (trimmed.startsWith('c.') || trimmed.startsWith('c ')) {
    return 'C'
  }
  if (trimmed.startsWith('p.') || trimmed.startsWith('p ')) {
    return 'P'
  }

  return null
}

async function main() {
  console.log('=== SDOPPIAMENTO FONTE: Statuti della Repubblica Fiorentina ===\n')

  if (DRY_RUN) {
    console.log('⚠️  MODALITA DRY RUN - nessuna modifica verrà effettuata\n')
  }

  await login()

  // 1. Cercare la fonte originale
  console.log('--- FASE 1: Verifica fonte originale ---\n')

  const fonteOrigResp = (await fetchAPI(
    `/fonti?where[shorthand_id][equals]=${ORIGINAL_SHORTHAND}&limit=1`
  )) as PayloadResponse

  if (fonteOrigResp.totalDocs === 0) {
    throw new Error(`Fonte originale "${ORIGINAL_SHORTHAND}" non trovata nel database`)
  }

  const fonteOrig = fonteOrigResp.docs[0]
  console.log(`✅ Fonte originale trovata: id=${fonteOrig.id}, shorthand_id="${ORIGINAL_SHORTHAND}"\n`)

  // 2. Recuperare TUTTE le ricorrenze della fonte originale
  console.log('--- FASE 2: Recupero ricorrenze ---\n')

  const ricorrenzeResp = (await fetchAPI(
    `/ricorrenze?where[fonte][equals]=${fonteOrig.id}&limit=500&depth=1`
  )) as PayloadResponse

  const ricorrenze = ricorrenzeResp.docs
  console.log(`📊 Totale ricorrenze trovate: ${ricorrenze.length}\n`)

  // 3. Classificare le ricorrenze
  const classificazione = { C: [] as PayloadDoc[], P: [] as PayloadDoc[], unknown: [] as PayloadDoc[] }

  for (const ric of ricorrenze) {
    const paginaRaw = (ric.pagina_raw as string) || ''
    const tipo = classificaRicorrenza(paginaRaw)

    if (tipo === 'C') {
      classificazione.C.push(ric)
    } else if (tipo === 'P') {
      classificazione.P.push(ric)
    } else {
      classificazione.unknown.push(ric)
    }
  }

  console.log(`  Capitano (c.): ${classificazione.C.length}`)
  console.log(`  Podestà  (p.): ${classificazione.P.length}`)
  console.log(`  Non classificate: ${classificazione.unknown.length}`)

  if (classificazione.unknown.length > 0) {
    console.log('\n⚠️  Ricorrenze non classificate:')
    for (const ric of classificazione.unknown) {
      console.log(`  id=${ric.id} pagina_raw="${ric.pagina_raw}"`)
    }
    throw new Error('Ci sono ricorrenze non classificabili. Verificare manualmente.')
  }

  console.log(`\n✅ Tutte le ricorrenze sono state classificate\n`)

  if (DRY_RUN) {
    console.log('=== DRY RUN COMPLETATO ===')
    console.log(`Capitano: ${classificazione.C.length} ricorrenze verrebbero riassegnate`)
    console.log(`Podestà: ${classificazione.P.length} ricorrenze verrebbero riassegnate`)
    return
  }

  // 4. Creare le 2 nuove fonti
  console.log('--- FASE 3: Creazione nuove fonti ---\n')

  const nuoveFontiIds: Record<string, number> = {}

  for (const [key, fonteData] of Object.entries(NUOVE_FONTI)) {
    // Verifico se esiste già
    const existResp = (await fetchAPI(
      `/fonti?where[shorthand_id][equals]=${fonteData.shorthand_id}&limit=1`
    )) as PayloadResponse

    if (existResp.totalDocs > 0) {
      nuoveFontiIds[key] = existResp.docs[0].id
      console.log(`  ℹ️  Fonte "${fonteData.shorthand_id}" già esistente (id=${existResp.docs[0].id})`)
    } else {
      const created = (await fetchAPI('/fonti', {
        method: 'POST',
        body: JSON.stringify(fonteData),
      })) as { doc: PayloadDoc }

      nuoveFontiIds[key] = created.doc.id
      console.log(`  ✅ Creata fonte "${fonteData.shorthand_id}" (id=${created.doc.id})`)
    }
  }

  console.log()

  // 5. Riassegnare le ricorrenze
  console.log('--- FASE 4: Riassegnazione ricorrenze ---\n')

  let successC = 0
  let successP = 0
  let errori = 0

  for (const ric of classificazione.C) {
    try {
      const paginaRaw = rewritePaginaRaw((ric.pagina_raw as string) || '', 'C')
      await fetchAPI(`/ricorrenze/${ric.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fonte: nuoveFontiIds.C, pagina_raw: paginaRaw }),
      })
      successC++
    } catch (error) {
      console.error(`  ❌ Errore riassegnazione ricorrenza id=${ric.id}: ${error}`)
      errori++
    }
  }
  console.log(`  Capitano: ${successC}/${classificazione.C.length} riassegnate`)

  for (const ric of classificazione.P) {
    try {
      const paginaRaw = rewritePaginaRaw((ric.pagina_raw as string) || '', 'P')
      await fetchAPI(`/ricorrenze/${ric.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fonte: nuoveFontiIds.P, pagina_raw: paginaRaw }),
      })
      successP++
    } catch (error) {
      console.error(`  ❌ Errore riassegnazione ricorrenza id=${ric.id}: ${error}`)
      errori++
    }
  }
  console.log(`  Podestà:  ${successP}/${classificazione.P.length} riassegnate`)

  if (errori > 0) {
    console.error(`\n❌ ${errori} errori durante la riassegnazione. La fonte originale NON verrà eliminata.`)
    return
  }

  console.log()

  // 6. Verificare che nessuna ricorrenza punti ancora alla fonte originale
  console.log('--- FASE 5: Verifica post-riassegnazione ---\n')

  const checkResp = (await fetchAPI(
    `/ricorrenze?where[fonte][equals]=${fonteOrig.id}&limit=1`
  )) as PayloadResponse

  if (checkResp.totalDocs > 0) {
    console.error(`❌ ${checkResp.totalDocs} ricorrenze puntano ancora alla fonte originale!`)
    console.error('La fonte originale NON verrà eliminata.')
    return
  }

  console.log('✅ Nessuna ricorrenza punta più alla fonte originale\n')

  // 7. Eliminare la fonte originale
  console.log('--- FASE 6: Eliminazione fonte originale ---\n')

  await fetchAPI(`/fonti/${fonteOrig.id}`, { method: 'DELETE' })
  console.log(`✅ Fonte originale "${ORIGINAL_SHORTHAND}" (id=${fonteOrig.id}) eliminata\n`)

  // 8. Report finale
  console.log('=== REPORT FINALE ===\n')
  console.log(`Fonte originale: "${ORIGINAL_SHORTHAND}" → ELIMINATA`)
  console.log(`Capitano (.C):   id=${nuoveFontiIds.C}, ${successC} ricorrenze`)
  console.log(`Podestà  (.P):   id=${nuoveFontiIds.P}, ${successP} ricorrenze`)
  console.log(`Totale:          ${successC + successP} ricorrenze riassegnate`)
  console.log(`Errori:          ${errori}`)
  console.log('\n✅ Sdoppiamento completato con successo!')
}

main().catch((error) => {
  console.error(`\n💥 Errore fatale: ${error}`)
  process.exit(1)
})
