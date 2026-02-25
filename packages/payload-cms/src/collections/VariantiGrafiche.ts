import { CollectionConfig } from 'payload/types'
import { authenticated, hasLemmarioAccess } from '../access'

/**
 * Collection: VariantiGrafiche
 *
 * Varianti grafiche di un lemma (es. "additio" → "adicio", "adictio")
 */
export const VariantiGrafiche: CollectionConfig = {
  slug: 'varianti-grafiche',
  labels: {
    singular: 'Variante Grafica',
    plural: 'Varianti Grafiche',
  },
  admin: {
    useAsTitle: 'variante',
    defaultColumns: ['variante', 'lemma', 'priorita'],
    group: 'Contenuti',
    description: 'Varianti grafiche dei lemmi',
  },
  access: {
    create: public_, // TEMP: per migrazione — ripristinare authenticated dopo import
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
        description: 'Lemma principale',
      },
    },
    {
      name: 'variante',
      type: 'text',
      required: true,
      admin: {
        description: 'Forma grafica alternativa',
      },
    },
    {
      name: 'priorita',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Ordinamento (0 = prima)',
      },
    },
  ],
  timestamps: true,
}
