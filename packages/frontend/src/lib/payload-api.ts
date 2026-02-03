/**
 * Payload CMS API client
 * Provides typed functions for fetching data from Payload collections
 */

import type {
  Lemmario,
  Lemma,
  Fonte,
  Definizione,
  Ricorrenza,
  LivelloRazionalita,
  VarianteGrafica,
  RiferimentoIncrociato,
  ContenutoStatico,
  PaginatedResponse,
} from '@/types/payload'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * Generic fetch wrapper with query params support
 */
async function fetchFromPayload<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const { params, ...fetchOptions } = options || {}

  let url = `${API_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    url += `?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
    // Enable caching for GET requests in production
    next: {
      revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * Lemmari API
 */
export async function getLemmari(options?: {
  limit?: number
  page?: number
  where?: Record<string, unknown>
  sort?: string
}): Promise<PaginatedResponse<Lemmario>> {
  const params: Record<string, string | number> = {
    limit: options?.limit || 10,
    page: options?.page || 1,
  }

  if (options?.where) {
    params.where = JSON.stringify(options.where)
  }

  if (options?.sort) {
    params.sort = options.sort
  }

  return fetchFromPayload<PaginatedResponse<Lemmario>>('/lemmari', { params })
}

/**
 * Get all active lemmari for home page
 * Includes count of lemmi for each lemmario
 */
export async function getAllLemmariWithStats(): Promise<(Lemmario & { _count?: { lemmi?: number } })[]> {
  try {
    const response = await getLemmari({
      where: { attivo: { equals: true } },
      limit: 100,
      sort: 'ordine',
    })

    // For each lemmario, fetch the count of lemmi
    // Note: This is a simplified approach. In production, you'd want to
    // add a custom endpoint in Payload that returns counts in a single query
    const lemmariWithStats = await Promise.all(
      response.docs.map(async (lemmario) => {
        try {
          const lemmiResponse = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
            params: {
              where: JSON.stringify({ lemmario: { equals: lemmario.id } }),
              limit: 1,
            },
          })
          return {
            ...lemmario,
            _count: { lemmi: lemmiResponse.totalDocs },
          }
        } catch {
          return {
            ...lemmario,
            _count: { lemmi: 0 },
          }
        }
      })
    )

    return lemmariWithStats
  } catch (error) {
    console.error('Error fetching lemmari with stats:', error)
    return []
  }
}

/**
 * Contenuti Statici API
 */
export async function getContenutiStatici(options?: {
  limit?: number
  page?: number
  where?: Record<string, unknown>
  sort?: string
}): Promise<PaginatedResponse<ContenutoStatico>> {
  const params: Record<string, string | number> = {
    limit: options?.limit || 10,
    page: options?.page || 1,
  }

  if (options?.where) {
    params.where = JSON.stringify(options.where)
  }

  if (options?.sort) {
    params.sort = options.sort
  }

  return fetchFromPayload<PaginatedResponse<ContenutoStatico>>('/contenuti-statici', { params })
}

/**
 * Get published global static content for navigation
 * These are contents without a lemmario association (global pages)
 * Note: Payload's exists:false doesn't work reliably for relationships,
 * so we filter client-side
 */
export async function getGlobalContenutiStatici(): Promise<ContenutoStatico[]> {
  try {
    const response = await getContenutiStatici({
      where: {
        pubblicato: { equals: true },
      },
      limit: 50,
      sort: 'ordine',
    })
    // Filter client-side: only include items without a lemmario
    return response.docs.filter(doc => !doc.lemmario)
  } catch (error) {
    console.error('Error fetching global static content:', error)
    return []
  }
}

/**
 * Get published static content for a specific lemmario
 * These are contents associated with a particular lemmario
 * Note: Payload's relationship filters don't work reliably,
 * so we filter client-side
 */
export async function getLemmarioContenutiStatici(lemmarioId: number): Promise<ContenutoStatico[]> {
  try {
    const response = await getContenutiStatici({
      where: {
        pubblicato: { equals: true },
      },
      limit: 50,
      sort: 'ordine',
    })
    // Filter client-side: only include items with matching lemmario
    return response.docs.filter(doc => {
      const docLemmarioId = typeof doc.lemmario === 'number'
        ? doc.lemmario
        : doc.lemmario?.id
      return docLemmarioId === lemmarioId
    })
  } catch (error) {
    console.error('Error fetching lemmario static content:', error)
    return []
  }
}

export async function getLemmarioBySlug(slug: string): Promise<Lemmario | null> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<Lemmario>>('/lemmari', {
      params: { where: JSON.stringify({ slug: { equals: slug } }), limit: 1 },
    })
    return response.docs[0] || null
  } catch {
    return null
  }
}

export async function getLemmarioById(id: number): Promise<Lemmario | null> {
  try {
    return await fetchFromPayload<Lemmario>(`/lemmari/${id}`)
  } catch {
    return null
  }
}

/**
 * Lemmi API
 */
export async function getLemmi(options?: {
  limit?: number
  page?: number
  where?: Record<string, unknown>
  depth?: number
}): Promise<PaginatedResponse<Lemma>> {
  const params: Record<string, string | number> = {
    limit: options?.limit || 20,
    page: options?.page || 1,
  }

  if (options?.where) {
    params.where = JSON.stringify(options.where)
  }

  if (options?.depth !== undefined) {
    params.depth = options.depth
  }

  return fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', { params })
}

export async function getLemmaBySlug(slug: string, lemmarioId?: number): Promise<Lemma | null> {
  try {
    // WORKAROUND: Payload API where filter on slug field doesn't work reliably
    // Instead, fetch all lemmi for the lemmario and filter client-side by slug
    // TODO: Debug why Payload where[slug][equals] returns all documents
    
    const where: Record<string, unknown> = {}
    if (lemmarioId) {
      where.lemmario = { equals: lemmarioId }
    }

    const response = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
      params: { where: JSON.stringify(where), limit: 500, depth: 2 },
    })
    
    // Filter client-side by slug
    const found = response.docs.find(lemma => lemma.slug === slug)
    
    return found || null
  } catch (error) {
    console.error('getLemmaBySlug error:', error)
    return null
  }
}

export async function getLemmaById(id: number, depth = 2): Promise<Lemma | null> {
  try {
    return await fetchFromPayload<Lemma>(`/lemmi/${id}?depth=${depth}`)
  } catch {
    return null
  }
}

/**
 * Search lemmi by termine (autocomplete)
 */
export async function searchLemmi(query: string, lemmarioId?: number): Promise<Lemma[]> {
  try {
    const where: Record<string, unknown> = {
      termine: { contains: query },
    }
    if (lemmarioId) {
      where.lemmario = { equals: lemmarioId }
    }

    const response = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
      params: { where: JSON.stringify(where), limit: 10 },
    })
    return response.docs
  } catch {
    return []
  }
}

/**
 * Definizioni API
 */
export async function getDefinizioniByLemma(lemmaId: number): Promise<Definizione[]> {
  try {
    // WORKAROUND: Payload where filter doesn't work, fetch all and filter client-side
    const response = await fetchFromPayload<PaginatedResponse<Definizione>>('/definizioni', {
      params: {
        limit: 500,
        depth: 2,
      },
    })
    // Filter client-side by lemma ID
    return response.docs
      .filter(def => {
        const lemma = typeof def.lemma === 'number' ? def.lemma : def.lemma?.id
        return lemma === lemmaId
      })
      .sort((a, b) => (a.numero || 0) - (b.numero || 0))
  } catch (error) {
    console.error('getDefinizioniByLemma error:', error)
    return []
  }
}

/**
 * Ricorrenze API
 */
export async function getRicorrenzeByDefinizione(definizioneId: number): Promise<Ricorrenza[]> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<Ricorrenza>>('/ricorrenze', {
      params: {
        where: JSON.stringify({ definizione: { equals: definizioneId } }),
        limit: 100,
        depth: 2,
      },
    })
    return response.docs
  } catch {
    return []
  }
}

/**
 * Varianti Grafiche API
 */
export async function getVariantiByLemma(lemmaId: number): Promise<VarianteGrafica[]> {
  try {
    // WORKAROUND: Payload where filter doesn't work, fetch all and filter client-side
    const response = await fetchFromPayload<PaginatedResponse<VarianteGrafica>>('/varianti-grafiche', {
      params: {
        limit: 500,
      },
    })
    // Filter client-side by lemma ID
    return response.docs.filter(variante => {
      const lemma = typeof variante.lemma === 'number' ? variante.lemma : variante.lemma?.id
      return lemma === lemmaId
    })
  } catch (error) {
    console.error('getVariantiByLemma error:', error)
    return []
  }
}

/**
 * Riferimenti Incrociati API
 */
export async function getRiferimentiByLemma(lemmaId: number): Promise<RiferimentoIncrociato[]> {
  try {
    // WORKAROUND: Payload where filter doesn't work, fetch all and filter client-side
    const response = await fetchFromPayload<PaginatedResponse<RiferimentoIncrociato>>('/riferimenti-incrociati', {
      params: {
        limit: 500,
        depth: 2,
      },
    })
    // Filter client-side by lemma_origine ID
    return response.docs.filter(rif => {
      const lemma = typeof rif.lemma_origine === 'number' ? rif.lemma_origine : rif.lemma_origine?.id
      return lemma === lemmaId
    })
  } catch (error) {
    console.error('getRiferimentiByLemma error:', error)
    return []
  }
}

/**
 * Fonti API
 */
export async function getFonteById(id: number): Promise<Fonte | null> {
  try {
    return await fetchFromPayload<Fonte>(`/fonti/${id}`)
  } catch {
    return null
  }
}

export async function getFonteByShorthand(shorthandId: string): Promise<Fonte | null> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<Fonte>>('/fonti', {
      params: {
        where: JSON.stringify({ shorthand_id: { equals: shorthandId } }),
        limit: 1,
      },
    })
    return response.docs[0] || null
  } catch {
    return null
  }
}

/**
 * Livelli Razionalità API
 */
export async function getLivelliRazionalita(lemmarioId: number): Promise<LivelloRazionalita[]> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<LivelloRazionalita>>('/livelli-razionalita', {
      params: {
        where: JSON.stringify({ lemmario: { equals: lemmarioId } }),
        sort: 'ordine',
        limit: 100,
      },
    })
    return response.docs
  } catch {
    return []
  }
}

/**
 * Contenuti Statici API
 * Note: Payload's where filters don't work reliably, so we filter client-side
 */
export async function getContenutoStaticoBySlug(slug: string, lemmarioId?: number): Promise<ContenutoStatico | null> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<ContenutoStatico>>('/contenuti-statici', {
      params: { limit: 100 },
    })

    // Filter client-side by slug and optionally by lemmarioId
    const found = response.docs.find(doc => {
      if (doc.slug !== slug) return false

      if (lemmarioId !== undefined) {
        const docLemmarioId = typeof doc.lemmario === 'number'
          ? doc.lemmario
          : doc.lemmario?.id
        return docLemmarioId === lemmarioId
      }

      // For global pages, lemmario should be null/undefined
      return !doc.lemmario
    })

    return found || null
  } catch {
    return null
  }
}
