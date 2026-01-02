import { CollectionConfig } from 'payload/types'
import { hasLemmarioAccess, canCreateInLemmario } from '../access'

/**
 * Collection: Lemmi
 *
 * Entità principale: rappresenta un termine (lemma) nel dizionario.
 * Ogni lemma appartiene a un lemmario specifico (multi-tenancy).
 *
 * Relazioni:
 * - 1 Lemma → N VariantiGrafiche
 * - 1 Lemma → N Definizioni
 * - 1 Lemma → N RiferimentiIncrociati
 *
 * Access Control:
 * - Create: hasLemmarioAccess (admin/redattore del lemmario)
 * - Read: pubblico (solo se pubblicato=true)
 * - Update/Delete: hasLemmarioAccess
 */
export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  admin: {
    useAsTitle: 'termine',
    defaultColumns: ['termine', 'tipo', 'lemmario', 'pubblicato', 'updatedAt'],
    group: 'Contenuti',
    description: 'Gestione lemmi (termini del dizionario)',
  },
  access: {
    // Create: admin/redattore del lemmario
    create: canCreateInLemmario,
    // Read: pubblico (solo pubblicati) o hasLemmarioAccess (anche non pubblicati)
    read: ({ req: { user } }) => {
      // Se non autenticato, mostra solo pubblicati
      if (!user) {
        return {
          pubblicato: {
            equals: true,
          },
        }
      }
      // Se autenticato, usa hasLemmarioAccess (include non pubblicati dei propri lemmari)
      // TODO: implementare logica complessa
      return true
    },
    // Update: hasLemmarioAccess
    update: hasLemmarioAccess,
    // Delete: hasLemmarioAccess
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
        position: 'sidebar',
      },
      // Filtra lemmari accessibili
      // TODO: implementare filterOptions dinamico
    },
    {
      name: 'termine',
      type: 'text',
      required: true,
      admin: {
        description: 'Termine principale del lemma (es. "ADDITIO", "camera")',
        placeholder: 'ADDITIO',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Latino',
          value: 'latino',
        },
        {
          label: 'Volgare (Italiano)',
          value: 'volgare',
        },
      ],
      admin: {
        description: 'Tipologia linguistica del termine',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description: 'Slug URL-friendly (auto-generato da termine se vuoto)',
        placeholder: 'additio',
      },
      hooks: {
        beforeChange: [
          ({ value, data, operation }) => {
            // Auto-generate slug from termine if empty
            if (operation === 'create' && !value && data?.termine) {
              return data.termine
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'ordinamento',
      type: 'text',
      admin: {
        description: 'Chiave di ordinamento personalizzata (es. per ordine alfabetico speciale)',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            // Auto-generate from termine if empty
            if (!value && data?.termine) {
              return data.termine.toLowerCase()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'note_redazionali',
      type: 'textarea',
      admin: {
        description: 'Note interne per i redattori (non visibili pubblicamente)',
      },
    },
    {
      name: 'pubblicato',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Se attivo, il lemma è visibile pubblicamente',
        position: 'sidebar',
      },
    },
    {
      name: 'data_pubblicazione',
      type: 'date',
      admin: {
        description: 'Data di pubblicazione del lemma',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
  // Versioning per storico modifiche
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  // Hooks
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-set data_pubblicazione quando pubblicato passa da false a true
        if (operation === 'update' && data.pubblicato && !data.data_pubblicazione) {
          data.data_pubblicazione = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`Lemma ${operation}: ${doc.termine} (${doc.tipo}) - Lemmario: ${doc.lemmario}`)
      },
    ],
  },
}
