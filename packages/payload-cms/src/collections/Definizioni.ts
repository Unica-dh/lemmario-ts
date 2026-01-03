import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, public_ } from '../access'

/**
 * Collection: Definizioni
 *
 * Definizioni multiple per un lemma.
 * Un lemma può avere più significati numerati.
 */
export const Definizioni: CollectionConfig = {
  slug: 'definizioni',
  admin: {
    useAsTitle: 'testo',
    defaultColumns: ['lemma', 'numero', 'testo'],
    group: 'Contenuti',
    description: 'Definizioni dei lemmi',
  },
  access: {
    create: public_ // Temporarily for migration,
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
      type: 'richText',
      required: true,
      admin: {
        description: 'Testo della definizione',
      },
    },
  ],
  timestamps: true,
}
