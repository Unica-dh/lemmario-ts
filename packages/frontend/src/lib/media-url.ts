/**
 * Utility to construct full media URLs from Payload CMS relative paths
 */

const PAYLOAD_SERVER_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL?.replace('/api', '') || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
  : (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')

/**
 * Converts a Payload CMS media path to a full URL
 * Payload returns paths like "/media/filename.jpg"
 * Next.js Image requires absolute URLs for remote images
 */
export function getMediaUrl(path: string | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${PAYLOAD_SERVER_URL}${path}`
}
