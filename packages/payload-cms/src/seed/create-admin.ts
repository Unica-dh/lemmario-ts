/**
 * Script per creare il primo utente admin
 * Usa: pnpm create-admin
 * Environment: ADMIN_EMAIL, ADMIN_PASSWORD
 */
import payload from 'payload'
import { config } from '../payload.config'

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@lemmario.it'
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

  console.log('Payload initialized. Checking for existing users...')

  // Check if users already exist
  const existingUsers = await payload.find({
    collection: 'utenti',
    limit: 1,
  })

  if (existingUsers.totalDocs > 0) {
    console.log('Users already exist. Checking if admin exists...')

    const existingAdmin = await payload.find({
      collection: 'utenti',
      where: {
        email: { equals: email },
      },
      limit: 1,
    })

    if (existingAdmin.totalDocs > 0) {
      console.log('Admin user already exists. Updating password...')

      await payload.update({
        collection: 'utenti',
        id: existingAdmin.docs[0].id,
        data: {
          password: password,
        },
      })

      console.log('Password updated for existing admin.')
      process.exit(0)
    }
  }

  console.log('Creating admin user...')

  try {
    const user = await payload.create({
      collection: 'utenti',
      data: {
        email,
        password,
        nome: 'Admin',
        cognome: 'Lemmario',
        ruolo: 'super_admin',
        attivo: true,
      },
    })

    console.log(`SUCCESS: Admin user created with ID: ${user.id}`)
    process.exit(0)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('ERROR creating user:', errorMessage)
    process.exit(1)
  }
}

createAdmin()
