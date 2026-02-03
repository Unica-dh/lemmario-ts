import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess } from '../access'

/**
 * Collection: LivelliRazionalita
 *
 * Livelli di razionalità specifici per lemmario.
 * Campo custom del "Lemmario Razionale" che classifica i concetti matematici.
 */
export const LivelliRazionalita: CollectionConfig = {
  slug: 'livelli-razionalita',
  labels: {
    singular: 'Livello di Razionalità',
    plural: 'Livelli di Razionalità',
  },
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['lemmario', 'numero', 'nome'],
    group: 'Contenuti',
    description: 'Livelli di razionalità (specifici per lemmario)',
  },
  access: {
    create: () => true, // TEMPORARY: Allow public create for migration
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemmario di appartenenza',
      },
    },
    {
      name: 'numero',
      type: 'number',
      required: true,
      admin: {
        description: 'Numero del livello (1, 2, 3, 4)',
      },
    },
    {
      name: 'nome',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome del livello (es. "Operazioni", "Elementi tecnici")',
      },
    },
    {
      name: 'descrizione',
      type: 'textarea',
      admin: {
        description: 'Descrizione del livello di razionalità',
      },
    },
  ],
  timestamps: true,
}
