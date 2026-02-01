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
  StoricoModifiche,
} from './collections'

// Import Italian translations
import itTranslations from './translations/it.json'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  rateLimit: {
    max: 10000, // Aumentato per permettere migrazione
    window: 60000, // 1 minuto
  },
  admin: {
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- Lemmario CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  i18n: {
    fallbackLng: 'it',
    supportedLngs: ['it'],
    resources: {
      it: itTranslations,
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
    
    // System Collections
    StoricoModifiche,
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
      connectionString: String(process.env.DATABASE_URI),
    },
    push: true,
  }),
  cors: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
})
