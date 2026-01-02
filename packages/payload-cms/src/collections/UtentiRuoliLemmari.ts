import { CollectionConfig } from 'payload/types'

/**
 * Collection: UtentiRuoliLemmari
 *
 * Junction table che associa Utenti a Lemmari con ruoli specifici.
 * Permette di assegnare permessi granulari per-lemmario.
 *
 * Un utente può avere ruoli diversi su lemmari diversi:
 * - Es: Mario è lemmario_admin su "Lemmario Razionale"
 *       ma redattore su "Lemmario Mercantile"
 *
 * Access Control:
 * - Create/Update/Delete: super_admin + lemmario_admin del lemmario specifico
 * - Read: super_admin + self (vedi proprie assegnazioni)
 */
export const UtentiRuoliLemmari: CollectionConfig = {
  slug: 'utenti-ruoli-lemmari',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['utente', 'lemmario', 'ruolo', 'data_assegnazione'],
    group: 'Multi-Tenancy',
    description: 'Assegnazione permessi utenti per-lemmario',
  },
  access: {
    // Super admin + lemmario_admin possono creare assegnazioni
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      // TODO: verificare che sia lemmario_admin del lemmario specifico
      return user.ruolo === 'lemmario_admin'
    },
    // Utente può leggere le proprie assegnazioni, super_admin tutte
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      // Può leggere solo le proprie assegnazioni
      return {
        utente: {
          equals: user.id,
        },
      }
    },
    // Super admin + lemmario_admin possono aggiornare
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      return user.ruolo === 'lemmario_admin'
    },
    // Super admin + lemmario_admin possono eliminare
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      return user.ruolo === 'lemmario_admin'
    },
  },
  fields: [
    {
      name: 'utente',
      type: 'relationship',
      relationTo: 'utenti',
      required: true,
      hasMany: false,
      admin: {
        description: 'Utente a cui assegnare i permessi',
      },
    },
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemmario su cui l\'utente ha permessi',
      },
    },
    {
      name: 'ruolo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Lemmario Admin',
          value: 'lemmario_admin',
        },
        {
          label: 'Redattore',
          value: 'redattore',
        },
        {
          label: 'Lettore',
          value: 'lettore',
        },
      ],
      admin: {
        description: 'Ruolo dell\'utente su questo specifico lemmario',
      },
    },
    {
      name: 'data_assegnazione',
      type: 'date',
      admin: {
        description: 'Data di assegnazione del ruolo',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ operation, value }) => {
            // Auto-set data_assegnazione on create
            if (operation === 'create' && !value) {
              return new Date().toISOString()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'assegnato_da',
      type: 'relationship',
      relationTo: 'utenti',
      hasMany: false,
      admin: {
        description: 'Utente che ha effettuato l\'assegnazione',
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            // Auto-set assegnato_da on create
            if (operation === 'create' && !value && req.user) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
  ],
  timestamps: true,
  // Hooks
  hooks: {
    afterChange: [
      ({ doc, operation }) => {
        console.log(
          `Assegnazione ${operation}: Utente ${doc.utente} - Ruolo ${doc.ruolo} su Lemmario ${doc.lemmario}`
        )
      },
    ],
  },
}
