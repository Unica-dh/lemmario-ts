import { CollectionConfig } from 'payload/types'
import { authenticated, public_ } from '../access'

/**
 * Collection: Fonti
 *
 * Fonti bibliografiche condivise tra tutti i lemmari.
 * Utilizzate dalle Ricorrenze per citare le fonti storiche.
 */
export const Fonti: CollectionConfig = {
  slug: 'fonti',
  admin: {
    useAsTitle: 'titolo',
    defaultColumns: ['shorthand_id', 'titolo', 'autore', 'anno'],
    group: 'Contenuti',
    description: 'Gestione fonti bibliografiche (condivise tra lemmari)',
  },
  access: {
    create: authenticated,
    read: public_,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'shorthand_id',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'ID breve per citazioni (es. "Stat.fornai.1339")',
      },
    },
    {
      name: 'titolo',
      type: 'text',
      required: true,
      admin: {
        description: 'Titolo completo dell\'opera',
      },
    },
    {
      name: 'autore',
      type: 'text',
      admin: {
        description: 'Autore dell\'opera (se noto)',
      },
    },
    {
      name: 'anno',
      type: 'text',
      admin: {
        description: 'Anno o periodo di pubblicazione',
      },
    },
    {
      name: 'riferimento_completo',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Citazione bibliografica completa',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Note aggiuntive sulla fonte',
      },
    },
  ],
  timestamps: true,
}
