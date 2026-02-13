import { CollectionConfig } from 'payload/types'

/**
 * Collection: Lemmari
 *
 * Rappresenta un singolo lemmario all'interno del sistema multi-tenancy.
 * Ogni lemmario è un container isolato di lemmi, definizioni e configurazioni.
 *
 * Access Control:
 * - Create: solo super_admin
 * - Read: pubblico
 * - Update/Delete: solo super_admin
 */
export const Lemmari: CollectionConfig = {
  slug: 'lemmari',
  labels: {
    singular: 'Lemmario',
    plural: 'Lemmari',
  },
  admin: {
    useAsTitle: 'titolo',
    defaultColumns: ['titolo', 'slug', 'attivo', 'periodo_storico', 'data_pubblicazione'],
    group: 'Multi-Tenancy',
    description: 'Gestione dei lemmari disponibili nella piattaforma',
  },
  access: {
    // Solo super_admin può creare lemmari
    create: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
    // Tutti possono leggere i lemmari (pubblici)
    read: () => true,
    // Solo super_admin può aggiornare
    update: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
    // Solo super_admin può eliminare
    delete: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Identificatore URL-friendly (es. "lemmario-razionale", "lemmario-mercantile")',
        placeholder: 'lemmario-razionale',
      },
      validate: (val: string) => {
        // Validazione slug: solo lowercase, numeri e trattini
        if (!/^[a-z0-9-]+$/.test(val)) {
          return 'Lo slug può contenere solo lettere minuscole, numeri e trattini'
        }
        return true
      },
    },
    {
      name: 'titolo',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome completo del lemmario',
        placeholder: 'Lemmario Razionale',
      },
    },
    {
      name: 'descrizione',
      type: 'textarea',
      admin: {
        description: 'Descrizione breve del lemmario (visibile in home page)',
        placeholder: 'Dizionario della terminologia matematica ed economica medievale...',
      },
    },
    {
      name: 'periodo_storico',
      type: 'text',
      admin: {
        description: 'Periodo storico coperto dal lemmario',
        placeholder: 'XIV-XV secolo',
      },
    },
    {
      name: 'attivo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Se disattivato, il lemmario non sarà visibile pubblicamente',
        position: 'sidebar',
      },
    },
    {
      name: 'ordine',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Ordinamento nella home page (numeri più bassi appaiono prima)',
        position: 'sidebar',
        step: 1,
      },
    },
    {
      name: 'foto',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Immagine rappresentativa del lemmario (visibile nella card homepage). Dimensioni consigliate: 800x600px (4:3)',
        position: 'sidebar',
      },
    },
    {
      name: 'configurazione',
      type: 'json',
      admin: {
        description: 'Configurazioni specifiche del lemmario (es. { "has_livelli_razionalita": true })',
        position: 'sidebar',
      },
    },
    {
      name: 'data_pubblicazione',
      type: 'date',
      admin: {
        description: 'Data di pubblicazione pubblica del lemmario',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        position: 'sidebar',
      },
    },
    // SEO Configuration
    {
      name: 'seo',
      type: 'group',
      label: 'Impostazioni SEO',
      admin: {
        description: 'Configurazioni per motori di ricerca e crawler AI',
      },
      fields: [
        {
          name: 'consenti_ai_crawler',
          type: 'checkbox',
          defaultValue: true,
          label: 'Consenti indicizzazione AI',
          admin: {
            description: 'Se abilitato, crawler AI (GPTBot, ClaudeBot, etc.) possono indicizzare i contenuti di questo lemmario',
          },
        },
        {
          name: 'meta_description',
          type: 'textarea',
          label: 'Meta Description',
          admin: {
            description: 'Descrizione per motori di ricerca (150-160 caratteri). Se vuoto, usa il campo "descrizione"',
          },
        },
      ],
    },
  ],
  timestamps: true,
  // Hooks per logging
  hooks: {
    afterChange: [
      ({ doc, operation }) => {
        console.log(`Lemmario ${operation}: ${doc.titolo} (${doc.slug})`)
      },
    ],
  },
}
