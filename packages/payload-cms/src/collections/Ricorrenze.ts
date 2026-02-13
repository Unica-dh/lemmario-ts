import { CollectionConfig } from 'payload/types'
import { authenticated, hasLemmarioAccess } from '../access'

/**
 * Collection: Ricorrenze
 *
 * Occorrenze/citazioni di un lemma nelle fonti storiche.
 * Collega Definizioni con Fonti + contesto testuale.
 */
export const Ricorrenze: CollectionConfig = {
  slug: 'ricorrenze',
  labels: {
    singular: 'Ricorrenza',
    plural: 'Ricorrenze',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['definizione', 'fonte', 'pagina'],
    group: 'Contenuti',
    description: 'Ricorrenze (citazioni) dei lemmi nelle fonti',
  },
  access: {
    create: authenticated,
    read: () => true,
    update: hasLemmarioAccess,
    delete: hasLemmarioAccess,
  },
  fields: [
    {
      name: 'definizione',
      type: 'relationship',
      relationTo: 'definizioni',
      required: true,
      hasMany: false,
      admin: {
        description: 'Definizione a cui si riferisce la citazione',
      },
    },
    {
      name: 'fonte',
      type: 'relationship',
      relationTo: 'fonti',
      required: true,
      hasMany: false,
      admin: {
        description: 'Fonte bibliografica',
      },
    },
    {
      name: 'testo_originale',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Testo originale dalla fonte (latino o volgare)',
      },
    },
    {
      name: 'pagina_raw',
      type: 'text',
      admin: {
        description: 'Riferimento originale completo (es. "p. 123, rubr. 45 \\"De titulo\\"")',
      },
    },
    {
      name: 'tipo_riferimento',
      type: 'select',
      options: [
        { label: 'Pagina', value: 'pagina' },
        { label: 'Carta', value: 'carta' },
        { label: 'Colonna', value: 'colonna' },
        { label: 'Folio', value: 'folio' },
        { label: 'Misto', value: 'misto' },
      ],
      admin: {
        description: 'Tipo di riferimento principale',
      },
    },
    {
      name: 'numero',
      type: 'text',
      admin: {
        description: 'Numero principale (es. "123", "123r", "123-125")',
      },
    },
    {
      name: 'numero_secondario',
      type: 'text',
      admin: {
        description: 'Numero secondario per riferimenti misti',
      },
    },
    {
      name: 'rubrica_numero',
      type: 'text',
      admin: {
        description: 'Numero della rubrica',
      },
    },
    {
      name: 'rubrica_titolo',
      type: 'textarea',
      admin: {
        description: 'Titolo della rubrica',
      },
    },
    {
      name: 'libro',
      type: 'text',
      admin: {
        description: 'Numero del libro (es. "IV", "II")',
      },
    },
    {
      name: 'capitolo',
      type: 'text',
      admin: {
        description: 'Numero del capitolo',
      },
    },
    {
      name: 'sezione',
      type: 'text',
      admin: {
        description: 'Sezione del documento (es. "prima sezione", "seconda sezione")',
      },
    },
    {
      name: 'supplemento',
      type: 'text',
      admin: {
        description: 'Supplemento (es. "I", "n. 2")',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Note sulla ricorrenza',
      },
    },
  ],
  timestamps: true,
}
