import express from 'express'
import payload from 'payload'
import dotenv from 'dotenv'
import config from './payload.config'

// Load environment variables
dotenv.config({ path: '../../.env' })

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
