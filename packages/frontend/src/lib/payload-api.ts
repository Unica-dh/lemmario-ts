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

// Server-side uses internal Docker URL; client-side uses public URL
const API_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api')

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
  depth?: number
}): Promise<PaginatedResponse<Lemmario>> {
  const params: Record<string, string | number> = {
    limit: options?.limit || 10,
    page: options?.page || 1,
    depth: options?.depth ?? 1,
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
 * Bulk fetch all definitions grouped by lemma ID.
 * Single API call instead of N calls to getDefinizioniByLemma.
 */
export async function getAllDefinizioniGrouped(): Promise<Map<number, Definizione[]>> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<Definizione>>('/definizioni', {
      params: {
        limit: 1000,
        depth: 0,
      },
    })

    const grouped = new Map<number, Definizione[]>()

    for (const def of response.docs) {
      const lemmaId = typeof def.lemma === 'number' ? def.lemma : def.lemma?.id
      if (!lemmaId) continue

      const existing = grouped.get(lemmaId) || []
      existing.push(def)
      grouped.set(lemmaId, existing)
    }

    // Sort each group by numero
    for (const [, defs] of grouped) {
      defs.sort((a, b) => (a.numero || 0) - (b.numero || 0))
    }

    return grouped
  } catch (error) {
    console.error('getAllDefinizioniGrouped error:', error)
    return new Map()
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
 * Get all ricorrenze for multiple definitions in a single batch
 * Returns a map of definizione_id -> ricorrenze[]
 */
export async function getRicorrenzeByDefinizioniIds(definizioneIds: number[]): Promise<Map<number, Ricorrenza[]>> {
  try {
    if (definizioneIds.length === 0) {
      return new Map()
    }

    // Fetch all ricorrenze with depth=2 to populate fonte
    const response = await fetchFromPayload<PaginatedResponse<Ricorrenza>>('/ricorrenze', {
      params: {
        limit: 1000,
        depth: 2,
      },
    })

    // Group ricorrenze by definizione ID
    const ricorrenzeMap = new Map<number, Ricorrenza[]>()

    for (const ricorrenza of response.docs) {
      const defId = typeof ricorrenza.definizione === 'number'
        ? ricorrenza.definizione
        : ricorrenza.definizione?.id

      if (defId && definizioneIds.includes(defId)) {
        const existing = ricorrenzeMap.get(defId) || []
        existing.push(ricorrenza)
        ricorrenzeMap.set(defId, existing)
      }
    }

    return ricorrenzeMap
  } catch (error) {
    console.error('getRicorrenzeByDefinizioniIds error:', error)
    return new Map()
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
 * Get cross-reference map for all lemmi.
 * Returns a Map where key=lemmaId, value=array of destination lemma info.
 */
export async function getCrossReferenceMap(): Promise<Map<number, Array<{ id: number; slug: string; termine: string; tipo: string }>>> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<RiferimentoIncrociato>>('/riferimenti-incrociati', {
      params: {
        limit: 500,
        depth: 2,
      },
    })

    const map = new Map<number, Array<{ id: number; slug: string; termine: string; tipo: string }>>()

    for (const rif of response.docs) {
      const origineId = typeof rif.lemma_origine === 'number' ? rif.lemma_origine : rif.lemma_origine?.id
      const dest = typeof rif.lemma_destinazione === 'object' ? rif.lemma_destinazione : null

      if (!origineId || !dest) continue

      const existing = map.get(origineId) || []
      existing.push({
        id: dest.id,
        slug: dest.slug,
        termine: dest.termine,
        tipo: dest.tipo,
      })
      map.set(origineId, existing)
    }

    return map
  } catch (error) {
    console.error('getCrossReferenceMap error:', error)
    return new Map()
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
 * Get all fonti (shared across lemmari)
 */
export async function getAllFonti(): Promise<Fonte[]> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<Fonte>>('/fonti', {
      params: {
        limit: 500,
        depth: 0,
      },
    })
    return response.docs
  } catch (error) {
    console.error('getAllFonti error:', error)
    return []
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

/**
 * SEO API Functions
 */

/**
 * Get AI crawler configuration for all active lemmari
 * Returns array of { slug, consenti_ai } for robots.txt generation
 */
export async function getAICrawlerConfig(): Promise<Array<{ slug: string; consenti_ai: boolean }>> {
  try {
    const response = await getLemmari({
      where: { attivo: { equals: true } },
      limit: 100,
    })

    return response.docs.map(lemmario => ({
      slug: lemmario.slug,
      consenti_ai: lemmario.seo?.consenti_ai_crawler ?? true,
    }))
  } catch (error) {
    console.error('Error fetching AI crawler config:', error)
    return []
  }
}

/**
 * Get all published lemmi for sitemap generation
 * Returns lemmi with lemmario info for URL construction
 */
export async function getAllPublishedLemmiForSitemap(): Promise<Array<{
  slug: string
  updatedAt: string
  lemmarioSlug: string
}>> {
  try {
    // First get all active lemmari
    const lemmariResponse = await getLemmari({
      where: { attivo: { equals: true } },
      limit: 100,
    })

    const allLemmi: Array<{ slug: string; updatedAt: string; lemmarioSlug: string }> = []

    // For each lemmario, fetch published lemmi
    for (const lemmario of lemmariResponse.docs) {
      try {
        const lemmiResponse = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
          params: {
            where: JSON.stringify({
              lemmario: { equals: lemmario.id },
              pubblicato: { equals: true },
            }),
            limit: 1000,
          },
        })

        for (const lemma of lemmiResponse.docs) {
          allLemmi.push({
            slug: lemma.slug,
            updatedAt: lemma.updatedAt,
            lemmarioSlug: lemmario.slug,
          })
        }
      } catch (error) {
        console.error(`Error fetching lemmi for lemmario ${lemmario.slug}:`, error)
      }
    }

    return allLemmi
  } catch (error) {
    console.error('Error fetching lemmi for sitemap:', error)
    return []
  }
}

/**
 * Get all active lemmari for sitemap
 */
export async function getActiveLemmariForSitemap(): Promise<Array<{
  slug: string
  updatedAt: string
}>> {
  try {
    const response = await getLemmari({
      where: { attivo: { equals: true } },
      limit: 100,
    })

    return response.docs.map(lemmario => ({
      slug: lemmario.slug,
      updatedAt: lemmario.updatedAt,
    }))
  } catch (error) {
    console.error('Error fetching lemmari for sitemap:', error)
    return []
  }
}

/**
 * Get all published contenuti statici for sitemap
 */
export async function getPublishedContenutiForSitemap(): Promise<Array<{
  slug: string
  updatedAt: string
  lemmarioSlug: string | null
}>> {
  try {
    const response = await getContenutiStatici({
      where: { pubblicato: { equals: true } },
      limit: 100,
    })

    return response.docs.map(contenuto => ({
      slug: contenuto.slug,
      updatedAt: contenuto.updatedAt,
      lemmarioSlug: typeof contenuto.lemmario === 'object' && contenuto.lemmario
        ? contenuto.lemmario.slug
        : null,
    }))
  } catch (error) {
    console.error('Error fetching contenuti for sitemap:', error)
    return []
  }
}
