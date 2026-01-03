import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, public_ } from '../access'

/**
 * Collection: Ricorrenze
 *
 * Occorrenze/citazioni di un lemma nelle fonti storiche.
 * Collega Definizioni con Fonti + contesto testuale.
 */
export const Ricorrenze: CollectionConfig = {
  slug: 'ricorrenze',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['definizione', 'fonte', 'pagina'],
    group: 'Contenuti',
    description: 'Ricorrenze (citazioni) dei lemmi nelle fonti',
  },
  access: {
    create: public_ // Temporarily for migration,
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'definizione',
      type: 'relationship',
      relationTo: 'definizioni',
      required: true,
      hasMany: false,
      admin: {
        description: 'Definizione a cui si riferisce la citazione',
      },
    },
    {
      name: 'fonte',
      type: 'relationship',
      relationTo: 'fonti',
      required: true,
      hasMany: false,
      admin: {
        description: 'Fonte bibliografica',
      },
    },
    {
      name: 'testo_originale',
      type: 'richText',
      required: true,
      admin: {
        description: 'Testo originale dalla fonte (latino o volgare)',
      },
    },
    {
      name: 'pagina',
      type: 'text',
      admin: {
        description: 'Riferimento pagina/carta (es. "c. 12r", "p. 45")',
      },
    },
    {
      name: 'livello_razionalita',
      type: 'relationship',
      relationTo: 'livelli-razionalita',
      hasMany: false,
      admin: {
        description: 'Livello di razionalità (se applicabile)',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Note sulla ricorrenza',
      },
    },
  ],
  timestamps: true,
}
