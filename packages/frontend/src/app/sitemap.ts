import { MetadataRoute } from 'next'
import {
  getActiveLemmariForSitemap,
  getAllPublishedLemmiForSitemap,
  getPublishedContenutiForSitemap,
} from '@/lib/payload-api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // 1. Home page
  entries.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  // 2. Ricerca page
  entries.push({
    url: `${SITE_URL}/ricerca`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  })

  try {
    // 3. Lemmari pages
    const lemmari = await getActiveLemmariForSitemap()
    for (const lemmario of lemmari) {
      entries.push({
        url: `${SITE_URL}/${lemmario.slug}`,
        lastModified: new Date(lemmario.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    }

    // 4. Lemmi pages (the most important content)
    const lemmi = await getAllPublishedLemmiForSitemap()
    for (const lemma of lemmi) {
      entries.push({
        url: `${SITE_URL}/${lemma.lemmarioSlug}/lemmi/${lemma.slug}`,
        lastModified: new Date(lemma.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }

    // 5. Contenuti statici (pagine informative)
    const contenuti = await getPublishedContenutiForSitemap()
    for (const contenuto of contenuti) {
      const path = contenuto.lemmarioSlug
        ? `/${contenuto.lemmarioSlug}/pagine/${contenuto.slug}`
        : `/pagine/${contenuto.slug}`

      entries.push({
        url: `${SITE_URL}${path}`,
        lastModified: new Date(contenuto.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return entries
}
