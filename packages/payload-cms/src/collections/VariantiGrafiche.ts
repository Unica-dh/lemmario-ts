import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, canCreateInLemmario } from '../access'

/**
 * Collection: VariantiGrafiche
 *
 * Varianti grafiche di un lemma (es. "additio" → "adicio", "adictio")
 */
export const VariantiGrafiche: CollectionConfig = {
  slug: 'varianti-grafiche',
  admin: {
    useAsTitle: 'variante',
    defaultColumns: ['variante', 'lemma', 'priorita'],
    group: 'Contenuti',
    description: 'Varianti grafiche dei lemmi',
  },
  access: {
    create: canCreateInLemmario,
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
