/**
 * API client for communicating with Payload CMS backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiError {
  message: string
  status: number
}

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw {
        message: `API Error: ${response.statusText}`,
        status: response.status,
      } as ApiError
    }

    return response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}
