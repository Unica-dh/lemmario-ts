import { CollectionConfig } from 'payload/types'
import { authenticated } from '../access'

/**
 * Collection: StoricoModifiche
 * 
 * Traccia automaticamente tutte le modifiche alle entità del sistema
 * attraverso hooks afterChange applicati alle collections critiche.
 */
export const StoricoModifiche: CollectionConfig = {
  slug: 'storico-modifiche',
  admin: {
    useAsTitle: 'record_id',
    defaultColumns: ['tabella', 'operazione', 'utente', 'timestamp'],
    description: 'Audit trail automatico di tutte le modifiche al sistema',
    group: 'Sistema',
    disableDuplicate: true,
  },
  access: {
    // Solo lettura per utenti autenticati
    create: () => false, // Creato solo via hooks
    read: authenticated,
    update: () => false, // Immutabile
    delete: () => false, // Immutabile
  },
  fields: [
    {
      name: 'tabella',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Nome della collection modificata (slug)',
        readOnly: true,
      },
    },
    {
      name: 'record_id',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'ID del record modificato',
        readOnly: true,
      },
    },
    {
      name: 'operazione',
      type: 'select',
      required: true,
      options: [
        { label: 'CREATE', value: 'create' },
        { label: 'UPDATE', value: 'update' },
        { label: 'DELETE', value: 'delete' },
      ],
      admin: {
        description: 'Tipo di operazione effettuata',
        readOnly: true,
      },
    },
    {
      name: 'dati_precedenti',
      type: 'json',
      admin: {
        description: 'Snapshot dei dati prima della modifica (null per CREATE)',
        readOnly: true,
      },
    },
    {
      name: 'dati_successivi',
      type: 'json',
      admin: {
        description: 'Snapshot dei dati dopo la modifica (null per DELETE)',
        readOnly: true,
      },
    },
    {
      name: 'utente',
      type: 'relationship',
      relationTo: 'utenti',
      admin: {
        description: 'Utente che ha effettuato la modifica',
        readOnly: true,
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description: 'Data e ora della modifica',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'ip_address',
      type: 'text',
      admin: {
        description: 'Indirizzo IP da cui è stata effettuata la modifica',
        readOnly: true,
      },
    },
    {
      name: 'user_agent',
      type: 'text',
      admin: {
        description: 'User agent del browser/client',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
