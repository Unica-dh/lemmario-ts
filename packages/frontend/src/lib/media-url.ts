/**
 * Utility to construct full media URLs from Payload CMS relative paths
 *
 * Payload returns absolute URLs based on PAYLOAD_PUBLIC_SERVER_URL (e.g. http://localhost:3000/media/...).
 * In Docker, the frontend container can't reach localhost:3000 (that's itself on port 3000).
 * Server-side (Next.js Image optimizer), we always normalize to the internal Docker hostname.
 * The browser never fetches media URLs directly — they go through /_next/image proxy.
 */

const PAYLOAD_SERVER_BASE = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL?.replace('/api', '') || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
  : (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')

/**
 * Converts a Payload CMS media path to a full URL.
 * Handles both relative paths ("/media/file.jpg") and absolute URLs
 * ("http://localhost:3000/media/file.jpg") by always normalizing to
 * the correct base URL for the current environment.
 */
export function getMediaUrl(path: string | undefined): string | null {
  if (!path) return null

  // For absolute URLs, extract just the pathname and rebuild with the correct base
  if (path.startsWith('http')) {
    try {
      const url = new URL(path)
      return `${PAYLOAD_SERVER_BASE}${url.pathname}`
    } catch {
      return path
    }
  }

  return `${PAYLOAD_SERVER_BASE}${path}`
}
