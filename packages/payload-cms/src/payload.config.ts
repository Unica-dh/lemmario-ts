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
      it: {
        general: {
          'createNew': 'Crea Nuovo',
          'create': 'Crea',
          'columns': 'Colonne',
          'filters': 'Filtri',
          'filter': 'Filtra',
          'search': 'Cerca',
          'searchBy': 'Cerca per {{label}}',
          'sortBy': 'Ordina per {{label}}',
          'loading': 'Caricamento',
          'noResults': 'Nessun risultato trovato',
          'rows': 'righe',
          'of': 'di',
          'page': 'Pagina',
          'nextPage': 'Pagina successiva',
          'prevPage': 'Pagina precedente',
          'showing': 'Mostrando',
          'to': 'a',
          'edit': 'Modifica',
          'delete': 'Elimina',
          'duplicate': 'Duplica',
          'save': 'Salva',
          'saving': 'Salvataggio',
          'cancel': 'Annulla',
          'close': 'Chiudi',
          'confirm': 'Conferma',
          'dashboard': 'Dashboard',
          'logout': 'Esci',
          'logOut': 'Esci',
          'account': 'Account',
          'profile': 'Profilo',
        },
        fields: {
          'updatedAt': 'Aggiornato il',
          'createdAt': 'Creato il',
          'id': 'ID',
        },
        version: {
          'published': 'Pubblicato',
          'draft': 'Bozza',
          'autosave': 'Salvataggio automatico',
        },
        authentication: {
          'loggedIn': 'Accesso effettuato',
          'loggedOut': 'Disconnesso',
          'loginUser': 'Accedi',
          'username': 'Nome utente',
          'emailAddress': 'Indirizzo email',
          'password': 'Password',
          'newPassword': 'Nuova password',
          'confirmPassword': 'Conferma password',
          'forgotPassword': 'Password dimenticata?',
          'resetPassword': 'Reimposta password',
          'createFirstUser': 'Crea il primo utente',
        },
        validation: {
          'required': 'Questo campo è obbligatorio',
          'emailAddress': "Inserisci un indirizzo email valido",
          'invalidSelection': 'La selezione contiene uno o più valori non validi',
        },
      },
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
    push: false,
  }),
  cors: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  ].filter(Boolean),
})
