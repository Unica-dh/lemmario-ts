import { CollectionConfig } from 'payload/types'
import { adminOnly } from '../access'

/**
 * Collection: ContenutiStatici
 *
 * Pagine statiche (About, FAQ, etc.)
 * Possono essere globali o specifiche per lemmario.
 */
export const ContenutiStatici: CollectionConfig = {
  slug: 'contenuti-statici',
  admin: {
    useAsTitle: 'titolo',
    defaultColumns: ['titolo', 'slug', 'lemmario', 'pubblicato'],
    group: 'Contenuti',
    description: 'Pagine statiche (About, FAQ, etc.)',
  },
  access: {
    create: adminOnly,
    read: ({ req: { user } }) => {
      if (!user) {
        return {
          pubblicato: {
            equals: true,
          },
        }
      }
      return true
    },
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      hasMany: false,
      admin: {
        description: 'Lemmario specifico (lascia vuoto per pagina globale)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Slug URL (es. "about", "faq")',
      },
    },
    {
      name: 'titolo',
      type: 'text',
      required: true,
      admin: {
        description: 'Titolo della pagina',
      },
    },
    {
      name: 'contenuto',
      type: 'richText',
      required: true,
      admin: {
        description: 'Contenuto della pagina',
      },
    },
    {
      name: 'pubblicato',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
