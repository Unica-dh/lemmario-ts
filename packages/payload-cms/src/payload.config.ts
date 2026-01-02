import { buildConfig } from 'payload/config'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'

// Import all collections
import {
  Lemmari,
  Utenti,
  UtentiRuoliLemmari,
  Lemmi,
  VariantiGrafiche,
  Definizioni,
  Fonti,
  Ricorrenze,
  LivelliRazionalita,
  RiferimentiIncrociati,
  ContenutiStatici,
} from './collections'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- Lemmario CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  editor: lexicalEditor({}),
  collections: [
    // Multi-Tenancy Collections
    Lemmari,
    Utenti,
    UtentiRuoliLemmari,

    // Content Collections
    Lemmi,
    VariantiGrafiche,
    Definizioni,
    Fonti,
    Ricorrenze,
    LivelliRazionalita,
    RiferimentiIncrociati,
    ContenutiStatici,
  ],
  globals: [
    // Global settings will be added here
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  cors: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
})
