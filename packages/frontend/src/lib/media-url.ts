/**
 * Utility to construct full media URLs from Payload CMS relative paths.
 *
 * Problem: In Docker, the frontend container can't reach localhost:3000
 * (that's itself). Payload returns absolute URLs based on PAYLOAD_PUBLIC_SERVER_URL
 * which is often http://localhost:3000 in dev.
 *
 * Solution: Server-side, rewrite only localhost URLs to the internal Docker
 * hostname (payload:3000). Production URLs (e.g. https://glossari.dh.unica.it)
 * pass through unchanged since they're already correct and in remotePatterns.
 */

/**
 * Converts a Payload CMS media path to a full URL.
 * Handles both relative paths ("/media/file.jpg") and absolute URLs.
 */
export function getMediaUrl(path: string | undefined): string | null {
  if (!path) return null

  if (path.startsWith('http')) {
    // Server-side only: rewrite localhost URLs to internal Docker hostname
    if (typeof window === 'undefined') {
      try {
        const url = new URL(path)
        if (url.hostname === 'localhost') {
          const internalBase = process.env.INTERNAL_API_URL?.replace('/api', '')
          if (internalBase) {
            return `${internalBase}${url.pathname}`
          }
        }
      } catch {
        // Invalid URL, return as-is
      }
    }
    return path
  }

  // Relative path: prepend the appropriate base
  const base = typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://localhost:3000')
    : (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
  return `${base}${path}`
}
