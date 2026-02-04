import { MetadataRoute } from 'next'
import { getAICrawlerConfig } from '@/lib/payload-api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Fetch AI crawler configuration from backend
  let aiBlockedPaths: string[] = []

  try {
    const config = await getAICrawlerConfig()

    // Generate blocked paths for lemmari that don't allow AI crawlers
    aiBlockedPaths = config
      .filter(l => !l.consenti_ai)
      .map(l => `/${l.slug}/`)
  } catch (e) {
    console.error('Failed to fetch AI crawler config:', e)
  }

  const rules: MetadataRoute.Robots['rules'] = [
    // Standard crawlers - allow everything except admin/api
    {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
      ],
    },
  ]

  // Add AI-specific rules only if there are blocked paths
  if (aiBlockedPaths.length > 0) {
    // OpenAI crawlers
    rules.push({
      userAgent: 'GPTBot',
      allow: '/',
      disallow: aiBlockedPaths,
    })
    rules.push({
      userAgent: 'ChatGPT-User',
      allow: '/',
      disallow: aiBlockedPaths,
    })

    // Google AI
    rules.push({
      userAgent: 'Google-Extended',
      allow: '/',
      disallow: aiBlockedPaths,
    })

    // Anthropic crawlers
    rules.push({
      userAgent: 'ClaudeBot',
      allow: '/',
      disallow: aiBlockedPaths,
    })
    rules.push({
      userAgent: 'Claude-Web',
      allow: '/',
      disallow: aiBlockedPaths,
    })
    rules.push({
      userAgent: 'anthropic-ai',
      allow: '/',
      disallow: aiBlockedPaths,
    })

    // Other AI crawlers
    rules.push({
      userAgent: 'CCBot',
      allow: '/',
      disallow: aiBlockedPaths,
    })
    rules.push({
      userAgent: 'PerplexityBot',
      allow: '/',
      disallow: aiBlockedPaths,
    })
  }

  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
