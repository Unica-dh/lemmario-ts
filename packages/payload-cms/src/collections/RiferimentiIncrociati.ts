import { CollectionConfig } from 'payload/types'
// canCreateInLemmario: da usare dopo la migrazione al posto di public_
import { hasLemmarioAccess, public_ } from '../access'
import { createAuditTrail, createAuditTrailDelete, createBidirezionalita, deleteBidirezionalita } from '../hooks'

/**
 * Collection: RiferimentiIncrociati
 *
 * Collegamenti tra lemmi (anche cross-lemmario).
 * Gestisce automaticamente la bidirezionalità tramite hooks.
 */
export const RiferimentiIncrociati: CollectionConfig = {
  slug: 'riferimenti-incrociati',
  labels: {
    singular: 'Riferimento Incrociato',
    plural: 'Riferimenti Incrociati',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['lemma_origine', 'tipo_riferimento', 'lemma_destinazione', 'auto_creato'],
    group: 'Contenuti',
    description: 'Collegamenti bidirezionali tra lemmi',
  },
  access: {
    create: public_, // Temporaneo per migrazione - revertire a canCreateInLemmario dopo
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'lemma_origine',
      type: 'relationship',
      relationTo: 'lemmi',
      required: true,
      hasMany: false,
      admin: {
        description: 'Lemma di partenza',
      },
    },
    {
      name: 'tipo_riferimento',
      type: 'text',
      required: true,
      admin: {
        description: 'Tipo di riferimento (es. CFR, VEDI, VEDI ANCHE, sinonimo, contrario)',
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
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Note aggiuntive sul riferimento',
      },
    },
    {
      name: 'auto_creato',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Flag interno: indica se è stato creato automaticamente come riferimento inverso',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      createBidirezionalita, // Crea automaticamente riferimento inverso
      createAuditTrail, // Traccia modifiche
    ],
    afterDelete: [
      deleteBidirezionalita, // Elimina automaticamente riferimento inverso
      createAuditTrailDelete, // Traccia eliminazioni
    ],
  },
}
