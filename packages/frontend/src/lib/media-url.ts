/**
 * Utility to construct full media URLs from Payload CMS relative paths.
 *
 * Problem: In Docker, the frontend container can't reach external hostnames
 * (localhost or production domain like glossari.dh.unica.it) from within the
 * container. Payload returns absolute URLs based on PAYLOAD_PUBLIC_SERVER_URL.
 *
 * Solution: Server-side, rewrite all /media/ URLs to the internal Docker
 * hostname (payload:3000). This ensures the Next.js image optimizer can
 * fetch the original images for optimization.
 */

/**
 * Converts a Payload CMS media path to a full URL.
 * Handles both relative paths ("/media/file.jpg") and absolute URLs.
 */
export function getMediaUrl(path: string | undefined): string | null {
  if (!path) return null

  if (path.startsWith('http')) {
    // Server-side only: rewrite media URLs to internal Docker hostname.
    // This handles both localhost (dev) and production domain URLs,
    // since the Next.js image optimizer inside Docker can't reach external hostnames.
    if (typeof window === 'undefined') {
      try {
        const url = new URL(path)
        if (url.pathname.startsWith('/media/')) {
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

/**
 * Returns a browser-accessible URL for media files.
 * Unlike getMediaUrl, this never rewrites to Docker internal hostnames.
 * Use for <img> tags where the browser fetches the image directly (e.g. SVGs).
 */
export function getPublicMediaUrl(path: string | undefined): string | null {
  if (!path) return null

  if (path.startsWith('http')) {
    try {
      const url = new URL(path)
      if (url.pathname.startsWith('/media/')) {
        const publicBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'
        return `${publicBase}${url.pathname}`
      }
    } catch {
      // Invalid URL, return as-is
    }
    return path
  }

  const publicBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'
  return `${publicBase}${path}`
}
