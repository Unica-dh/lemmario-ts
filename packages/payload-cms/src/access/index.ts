import { Access, FieldAccess } from 'payload/types'
import { User } from 'payload/generated-types'

/**
 * Access Control Helpers per Multi-Tenancy
 *
 * Queste funzioni facilitano la gestione dei permessi basati su:
 * - Ruolo globale dell'utente (super_admin, lemmario_admin, redattore, lettore)
 * - Ruolo specifico per-lemmario (via junction table UtentiRuoliLemmari)
 */

/**
 * Verifica se l'utente è super admin
 */
export const isSuperAdmin = (user?: User | null): boolean => {
  return user?.ruolo === 'super_admin'
}

/**
 * Verifica se l'utente ha un ruolo specifico
 */
export const hasRole = (user: User | null | undefined, role: string): boolean => {
  return user?.ruolo === role
}

/**
 * Access: Solo super admin
 */
export const superAdminOnly: Access = ({ req: { user } }) => {
  return isSuperAdmin(user)
}

/**
 * Access: Super admin + lemmario admin
 */
export const adminOnly: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.ruolo === 'super_admin' || user.ruolo === 'lemmario_admin'
}

/**
 * Access: Tutti gli utenti autenticati
 */
export const authenticated: Access = ({ req: { user } }) => {
  return !!user
}

/**
 * Access: Pubblico (anche non autenticati)
 */
export const public_: Access = () => true

/**
 * Access per contenuti multi-tenancy
 *
 * Permette accesso se:
 * - Super admin: può accedere a tutto
 * - Lemmario admin/Redattore: può accedere solo ai contenuti dei propri lemmari
 *
 * NOTA: Questa funzione richiede che il documento abbia un campo 'lemmario' (relationship)
 */
export const hasLemmarioAccess: Access = async ({ req: { user, payload } }) => {
  if (!user) return false

  // Super admin può accedere a tutto
  if (isSuperAdmin(user)) return true

  // Altri utenti: ottieni lista lemmari accessibili
  try {
    const assegnazioni = await payload.find({
      collection: 'utenti-ruoli-lemmari',
      where: {
        utente: {
          equals: user.id,
        },
      },
      limit: 100,
    })

    if (!assegnazioni.docs || assegnazioni.docs.length === 0) {
      return false
    }

    // Estrai IDs dei lemmari accessibili
    const lemmariIds = assegnazioni.docs.map((doc) => doc.lemmario)

    // Ritorna query che limita ai lemmari accessibili
    return {
      lemmario: {
        in: lemmariIds,
      },
    }
  } catch (error) {
    console.error('Errore in hasLemmarioAccess:', error)
    return false
  }
}

/**
 * Access per CREATE su contenuti multi-tenancy
 *
 * Permette creazione se:
 * - Super admin: sempre
 * - Lemmario admin/Redattore: solo se hanno permessi sul lemmario specificato
 */
export const canCreateInLemmario: Access = async ({ req: { user, payload }, data }) => {
  if (!user) return false

  // Super admin può creare ovunque
  if (isSuperAdmin(user)) return true

  // Verifica se l'utente ha permessi sul lemmario specificato
  if (!data?.lemmario) {
    console.warn('Tentativo di creare contenuto senza specificare lemmario')
    return false
  }

  try {
    const assegnazione = await payload.find({
      collection: 'utenti-ruoli-lemmari',
      where: {
        and: [
          {
            utente: {
              equals: user.id,
            },
          },
          {
            lemmario: {
              equals: data.lemmario,
            },
          },
          {
            ruolo: {
              in: ['lemmario_admin', 'redattore'],
            },
          },
        ],
      },
      limit: 1,
    })

    return assegnazione.docs.length > 0
  } catch (error) {
    console.error('Errore in canCreateInLemmario:', error)
    return false
  }
}

/**
 * Field Access: Solo admin possono modificare
 */
export const adminFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false
  return user.ruolo === 'super_admin' || user.ruolo === 'lemmario_admin'
}

/**
 * Field Access: Solo super admin possono modificare
 */
export const superAdminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isSuperAdmin(user)
}

/**
 * Helper: Ottieni lemmari accessibili dall'utente
 */
export const getUserLemmari = async (
  userId: string,
  payload: any
): Promise<string[]> => {
  try {
    const assegnazioni = await payload.find({
      collection: 'utenti-ruoli-lemmari',
      where: {
        utente: {
          equals: userId,
        },
      },
      limit: 100,
    })

    return assegnazioni.docs.map((doc: any) => doc.lemmario)
  } catch (error) {
    console.error('Errore in getUserLemmari:', error)
    return []
  }
}
