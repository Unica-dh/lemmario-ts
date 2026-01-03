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
}): Promise<PaginatedResponse<Lemmario>> {
  const params: Record<string, string | number> = {
    limit: options?.limit || 10,
    page: options?.page || 1,
  }

  if (options?.where) {
    params.where = JSON.stringify(options.where)
  }

  return fetchFromPayload<PaginatedResponse<Lemmario>>('/lemmari', { params })
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
    const where: Record<string, unknown> = { slug: { equals: slug } }
    if (lemmarioId) {
      where.lemmario = { equals: lemmarioId }
    }

    const response = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
      params: { where: JSON.stringify(where), limit: 1, depth: 2 },
    })
    return response.docs[0] || null
  } catch {
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
    const response = await fetchFromPayload<PaginatedResponse<Definizione>>('/definizioni', {
      params: {
        where: JSON.stringify({ lemma: { equals: lemmaId } }),
        sort: 'numero_definizione',
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
    const response = await fetchFromPayload<PaginatedResponse<VarianteGrafica>>('/varianti-grafiche', {
      params: {
        where: JSON.stringify({ lemma: { equals: lemmaId } }),
        limit: 100,
      },
    })
    return response.docs
  } catch {
    return []
  }
}

/**
 * Riferimenti Incrociati API
 */
export async function getRiferimentiByLemma(lemmaId: number): Promise<RiferimentoIncrociato[]> {
  try {
    const response = await fetchFromPayload<PaginatedResponse<RiferimentoIncrociato>>('/riferimenti-incrociati', {
      params: {
        where: JSON.stringify({ lemma_origine: { equals: lemmaId } }),
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
 */
export async function getContenutoStaticoBySlug(slug: string, lemmarioId?: number): Promise<ContenutoStatico | null> {
  try {
    const where: Record<string, unknown> = { slug: { equals: slug } }
    if (lemmarioId) {
      where.lemmario = { equals: lemmarioId }
    }

    const response = await fetchFromPayload<PaginatedResponse<ContenutoStatico>>('/contenuti-statici', {
      params: { where: JSON.stringify(where), limit: 1 },
    })
    return response.docs[0] || null
  } catch {
    return null
  }
}
