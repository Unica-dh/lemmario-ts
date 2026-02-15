import { CollectionConfig } from 'payload/types'
import { createAuditTrail, createAuditTrailDelete } from '../hooks'

/**
 * Collection: Utenti
 *
 * Gestione utenti con autenticazione e ruoli.
 * Payload usa questa collection per l'auth built-in.
 *
 * Ruoli:
 * - super_admin: accesso completo a tutto
 * - lemmario_admin: gestione completa dei lemmari assegnati (via UtenteRuoloLemmario)
 * - redattore: può CRUD lemmi sui lemmari assegnati
 * - lettore: solo lettura (per lemmari privati)
 *
 * Access Control:
 * - Create: super_admin
 * - Read: self + super_admin + lemmario_admin
 * - Update: self + super_admin
 * - Delete: super_admin
 */
export const Utenti: CollectionConfig = {
  slug: 'utenti',
  labels: {
    singular: 'Utente',
    plural: 'Utenti',
  },
  auth: {
    // Abilita autenticazione built-in di Payload
    tokenExpiration: 7200, // 2 ore
    verify: false, // No email verification per ora
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minuti
    useAPIKey: true, // Abilita autenticazione via API key
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nome', 'cognome', 'ruolo', 'attivo'],
    group: 'Multi-Tenancy',
    description: 'Gestione utenti e autenticazione',
  },
  access: {
    // Temporaneo: permetti creazione primo utente senza auth
    // TODO: Ripristinare dopo creazione primo admin
    create: async ({ req: { user, payload } }) => {
      // Se non c'è utente loggato, verifica se esistono già utenti
      if (!user) {
        const existingUsers = await payload.find({
          collection: 'utenti',
          limit: 1,
          overrideAccess: true, // Bypass read access check
        })
        // Permetti creazione solo se non ci sono utenti
        return existingUsers.totalDocs === 0
      }
      return user?.ruolo === 'super_admin'
    },
    // Utente può leggere se stesso, super_admin può leggere tutti
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      // Può leggere solo se stesso
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Utente può aggiornare se stesso, super_admin può aggiornare tutti
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      // Può aggiornare solo se stesso
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Solo super_admin può eliminare
    delete: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Email per login (deve essere unica)',
      },
    },
    {
      name: 'nome',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome dell\'utente',
      },
    },
    {
      name: 'cognome',
      type: 'text',
      required: true,
      admin: {
        description: 'Cognome dell\'utente',
      },
    },
    {
      name: 'ruolo',
      type: 'select',
      required: true,
      defaultValue: 'lettore',
      options: [
        {
          label: 'Super Admin',
          value: 'super_admin',
        },
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
        description: 'Ruolo globale dell\'utente nel sistema',
        position: 'sidebar',
      },
      // Solo super_admin può modificare il ruolo
      access: {
        update: ({ req: { user } }) => user?.ruolo === 'super_admin',
      },
    },
    {
      name: 'attivo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Se disattivato, l\'utente non può effettuare il login',
        position: 'sidebar',
      },
      // Solo super_admin può modificare lo stato attivo
      access: {
        update: ({ req: { user } }) => user?.ruolo === 'super_admin',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Note interne sull\'utente (visibili solo a super_admin)',
        condition: (_data, { user }) => user?.ruolo === 'super_admin',
      },
      access: {
        read: ({ req: { user } }) => user?.ruolo === 'super_admin',
        update: ({ req: { user } }) => user?.ruolo === 'super_admin',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      createAuditTrail,
    ],
    afterDelete: [
      createAuditTrailDelete,
    ],
  },
}
