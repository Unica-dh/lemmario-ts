import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, canCreateInLemmario } from '../access'

/**
 * Collection: RiferimentiIncrociati
 *
 * Collegamenti tra lemmi (anche cross-lemmario).
 * Tipi: sinonimo, contrario, correlato, vedi_anche
 */
export const RiferimentiIncrociati: CollectionConfig = {
  slug: 'riferimenti-incrociati',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['lemma_sorgente', 'tipo', 'lemma_destinazione'],
    group: 'Contenuti',
    description: 'Collegamenti tra lemmi',
  },
  access: {
    create: canCreateInLemmario,
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'lemma_sorgente',
      type: 'relationship',
      relationTo: 'lemmi',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemma di partenza',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      options: [
        { label: 'Sinonimo', value: 'sinonimo' },
        { label: 'Contrario', value: 'contrario' },
        { label: 'Correlato', value: 'correlato' },
        { label: 'Vedi anche', value: 'vedi_anche' },
      ],
      admin: {
        description: 'Tipo di relazione',
      },
    },
    {
      name: 'lemma_destinazione',
      type: 'relationship',
      relationTo: 'lemmi',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemma di destinazione (può essere di altro lemmario)',
      },
    },
    {
      name: 'bidirezionale',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Se attivo, crea automaticamente il riferimento inverso',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Auto-create reverse reference if bidirezionale
        if (operation === 'create' && doc.bidirezionale) {
          try {
            await req.payload.create({
              collection: 'riferimenti-incrociati',
              data: {
                lemma_sorgente: doc.lemma_destinazione,
                tipo: doc.tipo,
                lemma_destinazione: doc.lemma_sorgente,
                bidirezionale: false, // Prevent infinite loop
              },
            })
            console.log(`Created reverse reference for ${doc.id}`)
          } catch (error) {
            console.error('Error creating reverse reference:', error)
          }
        }
      },
    ],
  },
}
