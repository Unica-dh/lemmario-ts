/**
 * Script per creare un utente servizio con API key.
 *
 * Uso:
 *   API_USER_EMAIL=api@lemmario.internal ADMIN_PASSWORD=... pnpm create-api-user
 *
 * L'utente viene creato con ruolo 'lettore' e API key abilitata.
 * Per assegnare accesso a un lemmario specifico, creare un record in
 * UtentiRuoliLemmari tramite admin UI o API.
 */
import payload from 'payload'
import crypto from 'crypto'
import config from '../payload.config'

const createApiUser = async () => {
  const email = process.env.API_USER_EMAIL || 'api-service@lemmario.internal'
  const password = process.env.ADMIN_PASSWORD

  if (!password) {
    console.error('ERROR: ADMIN_PASSWORD environment variable is required')
    process.exit(1)
  }

  console.log('Initializing Payload...')

  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'default-secret-for-dev',
    config,
    local: true,
  })

  console.log('Payload initialized. Checking for existing API user...')

  const existingUser = await payload.find({
    collection: 'utenti',
    where: {
      email: { equals: email },
    },
    limit: 1,
  })

  if (existingUser.totalDocs > 0) {
    console.log(`API user ${email} already exists (ID: ${existingUser.docs[0].id}).`)
    console.log('To regenerate the API key, use the admin UI.')
    process.exit(0)
  }

  console.log('Creating API service account...')

  // Genera API key (UUID v4) - Payload non la genera server-side,
  // solo il componente React admin la genera client-side
  const apiKey = crypto.randomUUID()

  try {
    const user = await payload.create({
      collection: 'utenti',
      data: {
        email,
        password,
        nome: 'API',
        cognome: 'Service Account',
        ruolo: 'lettore',
        attivo: true,
        enableAPIKey: true,
        apiKey,
      },
    })

    console.log(`\nSUCCESS: API user created with ID: ${user.id}`)
    console.log(`API Key: ${user.apiKey}`)
    console.log('\nPer autenticare le richieste, usa l\'header:')
    console.log(`  Authorization: utenti API-Key ${user.apiKey}`)
    console.log('\nRicorda di assegnare i lemmari tramite UtentiRuoliLemmari.')
    process.exit(0)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('ERROR creating API user:', errorMessage)
    process.exit(1)
  }
}

createApiUser()
