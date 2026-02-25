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
  Media,
} from './collections'

// Import Italian translations
import itTranslations from './translations/it.json'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 5000, // TEMP: aumentato per migrazione — ripristinare 500 dopo import
    window: 60000, // 1 minuto
  },
  maxDepth: 5, // Limita profondita' relazioni GraphQL/REST (default Payload: 10)
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
    Media,
  ],
  globals: [
    // Global settings will be added here
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
    maxComplexity: 1000, // Limita query complesse
    disablePlaygroundInProduction: true, // No playground in prod
  },
  db: postgresAdapter({
    pool: {
      connectionString: String(process.env.DATABASE_URI),
    },
    push: false, // Use migrations instead of push to avoid interactive prompts
  }),
  cors: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || []),
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
})
