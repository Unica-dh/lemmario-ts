import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, public_ } from '../access'
// import { createAuditTrail, createAuditTrailDelete } from '../hooks'

/**
 * Collection: Definizioni
 *
 * Definizioni multiple per un lemma.
 * Un lemma può avere più significati numerati.
 */
export const Definizioni: CollectionConfig = {
  slug: 'definizioni',
  labels: {
    singular: 'Definizione',
    plural: 'Definizioni',
  },
  admin: {
    useAsTitle: 'testo',
    defaultColumns: ['lemma', 'numero', 'testo'],
    group: 'Contenuti',
    description: 'Definizioni dei lemmi',
  },
  access: {
    create: public_, // Temporarily for migration
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'lemma',
      type: 'relationship',
      relationTo: 'lemmi',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemma di riferimento',
      },
    },
    {
      name: 'numero',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        description: 'Numero della definizione (1, 2, 3...)',
      },
    },
    {
      name: 'testo',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Testo della definizione',
      },
    },
    {
      name: 'livello_razionalita',
      type: 'relationship',
      relationTo: 'livelli-razionalita',
      hasMany: false,
      admin: {
        description: 'Livello di razionalità del concetto matematico (1-6)',
      },
    },
  ],
  timestamps: true,
  // Hooks temporaneamente disabilitati per debug migrazione
  // hooks: {
  //   afterChange: [createAuditTrail],
  //   afterDelete: [createAuditTrailDelete],
  // },
}
