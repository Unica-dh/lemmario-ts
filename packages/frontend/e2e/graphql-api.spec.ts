import { test, expect } from '@playwright/test'

/**
 * Test E2E per l'API GraphQL con autenticazione API Key.
 *
 * Questi test simulano chiamate da un consumatore esterno
 * usando `request` context di Playwright (no browser, solo HTTP).
 *
 * Prerequisiti:
 * - Payload CMS in esecuzione su localhost:3000
 * - Almeno un lemma pubblicato
 * - Un utente con API key abilitata (configurato in beforeAll)
 */

const API_URL = process.env.E2E_API_URL || 'http://localhost:3000'
const GRAPHQL_URL = `${API_URL}/api/graphql`

// Credenziali admin per setup
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@lemmario.dev'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'password'
// Chiave fissa per i test E2E (deterministica, evita race condition tra worker paralleli)
const TEST_API_KEY = 'e2e-test-api-key-00000000-0000'

let validApiKey: string = TEST_API_KEY

test.describe('GraphQL API - Autenticazione API Key', () => {
  // Tutti i test condividono la stessa API key, setup una sola volta
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    // Login come admin per ottenere JWT
    const loginRes = await request.post(`${API_URL}/api/utenti/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { token } = await loginRes.json()

    // Imposta API key fissa sull'utente admin
    const patchRes = await request.patch(`${API_URL}/api/utenti/1`, {
      headers: { Authorization: `JWT ${token}` },
      data: { enableAPIKey: true, apiKey: TEST_API_KEY },
    })
    expect(patchRes.ok()).toBeTruthy()
  })

  test.describe('Accesso pubblico (senza autenticazione)', () => {
    test('query lemmi pubblici ritorna dati', async ({ request }) => {
      const res = await request.post(GRAPHQL_URL, {
        data: {
          query: '{ Lemmis(limit: 2) { docs { id termine } totalDocs } }',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.data.Lemmis.totalDocs).toBeGreaterThan(0)
      expect(body.data.Lemmis.docs).toHaveLength(2)
      expect(body.data.Lemmis.docs[0]).toHaveProperty('termine')
    })

    test('query fonti pubbliche ritorna dati', async ({ request }) => {
      const res = await request.post(GRAPHQL_URL, {
        data: {
          query: '{ Fontis(limit: 1) { docs { id shorthand_id } totalDocs } }',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.data.Fontis.totalDocs).toBeGreaterThan(0)
    })

    test('query utenti senza auth ritorna errore 403', async ({ request }) => {
      const res = await request.post(GRAPHQL_URL, {
        data: {
          query: '{ Utentis { docs { id email } totalDocs } }',
        },
      })
      const body = await res.json()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].extensions.statusCode).toBe(403)
    })
  })

  test.describe('API key invalida', () => {
    test('con chiave sbagliata, fallback a non autenticato (dati pubblici accessibili)', async ({
      request,
    }) => {
      const res = await request.post(GRAPHQL_URL, {
        headers: {
          Authorization: 'utenti API-Key chiave-invalida-123456789012',
        },
        data: {
          query: '{ Lemmis(limit: 1) { docs { id termine } totalDocs } }',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      // Dati pubblici comunque accessibili
      expect(body.data.Lemmis.totalDocs).toBeGreaterThan(0)
    })

    test('con chiave sbagliata, dati privati restano inaccessibili', async ({
      request,
    }) => {
      const res = await request.post(GRAPHQL_URL, {
        headers: {
          Authorization: 'utenti API-Key chiave-invalida-123456789012',
        },
        data: {
          query: '{ Utentis { docs { id email } totalDocs } }',
        },
      })
      const body = await res.json()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].extensions.statusCode).toBe(403)
    })
  })

  test.describe('API key valida', () => {
    test('accesso a dati pubblici con autenticazione', async ({ request }) => {
      const res = await request.post(GRAPHQL_URL, {
        headers: {
          Authorization: `utenti API-Key ${validApiKey}`,
        },
        data: {
          query: '{ Lemmis(limit: 2) { docs { id termine tipo } totalDocs } }',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.data.Lemmis.totalDocs).toBeGreaterThan(0)
      expect(body.data.Lemmis.docs[0]).toHaveProperty('tipo')
    })

    test('accesso a dati privati (utenti) con API key valida', async ({
      request,
    }) => {
      const res = await request.post(GRAPHQL_URL, {
        headers: {
          Authorization: `utenti API-Key ${validApiKey}`,
        },
        data: {
          query: '{ Utentis { docs { id email } totalDocs } }',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.errors).toBeUndefined()
      expect(body.data.Utentis.totalDocs).toBeGreaterThan(0)
      expect(body.data.Utentis.docs[0]).toHaveProperty('email')
    })

    test('query con variabili funziona correttamente', async ({ request }) => {
      const res = await request.post(GRAPHQL_URL, {
        headers: {
          Authorization: `utenti API-Key ${validApiKey}`,
        },
        data: {
          query: `query LemmiPubblicati($limit: Int) {
            Lemmis(limit: $limit, where: { pubblicato: { equals: true } }) {
              docs { id termine slug }
              totalDocs
            }
          }`,
          variables: { limit: 3 },
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.data.Lemmis.docs).toHaveLength(3)
    })
  })

  test.describe('REST API con API key', () => {
    test('REST /api/lemmi accessibile con API key', async ({ request }) => {
      const res = await request.get(`${API_URL}/api/lemmi?limit=1`, {
        headers: {
          Authorization: `utenti API-Key ${validApiKey}`,
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.totalDocs).toBeGreaterThan(0)
    })

    test('REST /api/utenti/me ritorna utente autenticato', async ({
      request,
    }) => {
      const res = await request.get(`${API_URL}/api/utenti/me`, {
        headers: {
          Authorization: `utenti API-Key ${validApiKey}`,
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe(ADMIN_EMAIL)
    })
  })
})
