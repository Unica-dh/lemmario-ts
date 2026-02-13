import { CollectionConfig } from 'payload/types'

/**
 * Collection: Media
 *
 * Gestione upload di immagini e file media.
 * Utilizzata per foto lemmari e altri asset visivi.
 *
 * Access Control:
 * - Create/Update/Delete: solo super_admin
 * - Read: pubblico
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'mimeType', 'updatedAt'],
    group: 'Sistema',
    description: 'Gestione immagini e file media',
  },
  access: {
    create: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
    delete: ({ req: { user } }) => {
      return user?.ruolo === 'super_admin'
    },
  },
  upload: {
    staticDir: '../media',
    staticURL: '/media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'center',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        crop: 'center',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Testo alternativo per accessibilità (obbligatorio)',
      },
    },
  ],
}
