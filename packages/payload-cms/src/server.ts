import express from 'express'
import payload from 'payload'
import dotenv from 'dotenv'
import { spawn } from 'child_process'

// Load environment variables BEFORE importing config
dotenv.config({ path: '../../.env' })

import config from './payload.config'

// Debug: Log environment variables
console.log('Environment variables loaded:')
console.log('DATABASE_URI:', process.env.DATABASE_URI)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'undefined')
console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? '(set)' : 'undefined')

const app = express()
const PORT = process.env.PORT || 3000

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

const start = async () => {
  try {
    // Initialize Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET as string,
      express: app,
      config,
      onInit: async () => {
        payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
      },
    })

    // Database export endpoint - super_admin only
    app.get('/api/admin/export/database', async (req, res) => {
      try {
        // Authenticate via Payload JWT
        const user = (req as any).user
        if (!user || user.ruolo !== 'super_admin') {
          res.status(403).json({ error: 'Accesso riservato ai super admin' })
          return
        }

        // Parse DATABASE_URI to extract connection params
        const dbUri = process.env.DATABASE_URI
        if (!dbUri) {
          res.status(500).json({ error: 'DATABASE_URI non configurato' })
          return
        }

        const url = new URL(dbUri)
        const host = url.hostname
        const port = url.port || '5432'
        const dbName = url.pathname.replace('/', '')
        const username = url.username

        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const filename = `lemmario_backup_${date}.sql`

        res.setHeader('Content-Type', 'application/sql')
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

        const pgDump = spawn('pg_dump', ['-h', host, '-p', port, '-U', username, dbName], {
          env: { ...process.env, PGPASSWORD: url.password },
        })

        pgDump.stdout.pipe(res)

        pgDump.stderr.on('data', (data: Buffer) => {
          payload.logger.error(`pg_dump stderr: ${data.toString()}`)
        })

        pgDump.on('error', (err) => {
          payload.logger.error(`pg_dump failed to start: ${err.message}`)
          if (!res.headersSent) {
            res.status(500).json({ error: 'Impossibile avviare pg_dump' })
          }
        })

        pgDump.on('close', (code) => {
          if (code !== 0 && !res.headersSent) {
            res.status(500).json({ error: `pg_dump terminato con codice ${code}` })
          }
        })
      } catch (error) {
        payload.logger.error('Export database error:', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Errore durante l\'export del database' })
        }
      }
    })

    // Start Express server
    app.listen(PORT, () => {
      payload.logger.info(`Server listening on port ${PORT}`)
      payload.logger.info(`Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

start()
