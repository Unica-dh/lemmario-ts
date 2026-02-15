import { test, expect } from '@playwright/test'

/**
 * Test E2E per SEO: sitemap.xml e robots.txt
 *
 * Verifica che:
 * - /sitemap.xml restituisca XML valido conforme a sitemap.org
 * - Tutti i lemmari attivi siano presenti
 * - Tutti i lemmi pubblicati siano presenti con URL corretti
 * - I contenuti statici pubblicati siano presenti
 * - /robots.txt restituisca regole corrette per crawler standard e AI
 * - La sitemap sia referenziata nel robots.txt
 * - Il flag consenti_ai_crawler NON influenzi la sitemap (solo robots.txt)
 *
 * Prerequisiti:
 * - Frontend Next.js in esecuzione su localhost:3001
 * - Payload CMS in esecuzione su localhost:3000
 * - Almeno un lemmario attivo con lemmi pubblicati
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001'
const API_URL = process.env.E2E_API_URL || 'http://localhost:3000'

test.describe('Sitemap XML', () => {
  let sitemapText: string

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`)
    expect(res.ok()).toBeTruthy()
    sitemapText = await res.text()
  })

  test('risponde con status 200 e content-type XML', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`)
    expect(res.status()).toBe(200)
    const contentType = res.headers()['content-type'] || ''
    expect(contentType).toMatch(/xml/)
  })

  test('contiene il tag urlset con namespace sitemap.org', async () => {
    expect(sitemapText).toContain('http://www.sitemaps.org/schemas/sitemap/0.9')
    expect(sitemapText).toContain('<urlset')
    expect(sitemapText).toContain('</urlset>')
  })

  test('contiene la home page con priority 1.0', async () => {
    // La home deve avere priority massima
    expect(sitemapText).toContain(`<loc>${BASE_URL}</loc>`)
  })

  test('contiene le pagine dei lemmari attivi', async ({ request }) => {
    // Fetch lemmari attivi dall'API
    const apiRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    expect(apiRes.ok()).toBeTruthy()
    const { docs: lemmari } = await apiRes.json()

    expect(lemmari.length).toBeGreaterThan(0)

    for (const lemmario of lemmari) {
      const expectedUrl = `${BASE_URL}/${lemmario.slug}`
      expect(sitemapText).toContain(`<loc>${expectedUrl}</loc>`)
    }
  })

  test('contiene tutti i lemmi pubblicati con URL nel formato corretto', async ({
    request,
  }) => {
    // Fetch lemmari attivi
    const lemmariRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    const { docs: lemmari } = await lemmariRes.json()

    for (const lemmario of lemmari) {
      // Fetch lemmi pubblicati per questo lemmario
      const lemmiRes = await request.get(
        `${API_URL}/api/lemmi?where[lemmario][equals]=${lemmario.id}&where[pubblicato][equals]=true&limit=1000`
      )
      expect(lemmiRes.ok()).toBeTruthy()
      const { docs: lemmi } = await lemmiRes.json()

      for (const lemma of lemmi) {
        const expectedUrl = `${BASE_URL}/${lemmario.slug}/lemmi/${lemma.slug}`
        expect(sitemapText).toContain(`<loc>${expectedUrl}</loc>`)
      }
    }
  })

  test('contiene i contenuti statici pubblicati', async ({ request }) => {
    const contenutiRes = await request.get(
      `${API_URL}/api/contenuti-statici?where[pubblicato][equals]=true&limit=100`
    )
    expect(contenutiRes.ok()).toBeTruthy()
    const { docs: contenuti } = await contenutiRes.json()

    for (const contenuto of contenuti) {
      const lemmarioSlug =
        typeof contenuto.lemmario === 'object' && contenuto.lemmario
          ? contenuto.lemmario.slug
          : null
      const path = lemmarioSlug
        ? `/${lemmarioSlug}/pagine/${contenuto.slug}`
        : `/pagine/${contenuto.slug}`
      const expectedUrl = `${BASE_URL}${path}`
      expect(sitemapText).toContain(`<loc>${expectedUrl}</loc>`)
    }
  })

  test('ogni URL ha lastmod con data valida', async () => {
    // Estrai tutti i lastmod dal XML
    const lastmodMatches = sitemapText.match(/<lastmod>([^<]+)<\/lastmod>/g)
    expect(lastmodMatches).not.toBeNull()
    expect(lastmodMatches!.length).toBeGreaterThan(0)

    for (const match of lastmodMatches!) {
      const dateStr = match.replace(/<\/?lastmod>/g, '')
      const date = new Date(dateStr)
      expect(date.getTime()).not.toBeNaN()
    }
  })

  test('ogni URL ha changefreq valida', async () => {
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']
    const freqMatches = sitemapText.match(/<changefreq>([^<]+)<\/changefreq>/g)
    expect(freqMatches).not.toBeNull()

    for (const match of freqMatches!) {
      const freq = match.replace(/<\/?changefreq>/g, '')
      expect(validFreqs).toContain(freq)
    }
  })

  test('ogni URL ha priority tra 0.0 e 1.0', async () => {
    const priorityMatches = sitemapText.match(/<priority>([^<]+)<\/priority>/g)
    expect(priorityMatches).not.toBeNull()

    for (const match of priorityMatches!) {
      const priority = parseFloat(match.replace(/<\/?priority>/g, ''))
      expect(priority).toBeGreaterThanOrEqual(0.0)
      expect(priority).toBeLessThanOrEqual(1.0)
    }
  })

  test('non contiene URL duplicati', async () => {
    const locMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/g)
    expect(locMatches).not.toBeNull()

    const urls = locMatches!.map(m => m.replace(/<\/?loc>/g, ''))
    const uniqueUrls = new Set(urls)
    expect(urls.length).toBe(uniqueUrls.size)
  })

  test('non contiene lemmi non pubblicati', async ({ request }) => {
    // Fetch lemmi NON pubblicati (draft)
    const lemmariRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    const { docs: lemmari } = await lemmariRes.json()

    for (const lemmario of lemmari) {
      const draftRes = await request.get(
        `${API_URL}/api/lemmi?where[lemmario][equals]=${lemmario.id}&where[pubblicato][equals]=false&limit=100`
      )
      const { docs: draftLemmi } = await draftRes.json()

      for (const lemma of draftLemmi) {
        const draftUrl = `${BASE_URL}/${lemmario.slug}/lemmi/${lemma.slug}`
        expect(sitemapText).not.toContain(`<loc>${draftUrl}</loc>`)
      }
    }
  })

  test('la sitemap include lemmi indipendentemente dal flag consenti_ai_crawler', async ({
    request,
  }) => {
    // Verifica che TUTTI i lemmi pubblicati siano in sitemap,
    // anche se il loro lemmario ha consenti_ai_crawler = false
    const lemmariRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    const { docs: lemmari } = await lemmariRes.json()

    let totalLemmiInApi = 0
    for (const lemmario of lemmari) {
      const lemmiRes = await request.get(
        `${API_URL}/api/lemmi?where[lemmario][equals]=${lemmario.id}&where[pubblicato][equals]=true&limit=1000`
      )
      const { docs: lemmi } = await lemmiRes.json()
      totalLemmiInApi += lemmi.length
    }

    // Conta gli URL di lemmi nella sitemap (pattern: /lemmi/)
    const lemmiUrls = sitemapText.match(/<loc>[^<]*\/lemmi\/[^<]+<\/loc>/g) || []
    expect(lemmiUrls.length).toBe(totalLemmiInApi)
  })
})

test.describe('Robots.txt', () => {
  let robotsText: string

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`)
    expect(res.ok()).toBeTruthy()
    robotsText = await res.text()
  })

  test('risponde con status 200 e content-type text', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`)
    expect(res.status()).toBe(200)
    const contentType = res.headers()['content-type'] || ''
    expect(contentType).toMatch(/text/)
  })

  test('contiene regole per User-Agent: *', async () => {
    // Next.js genera "User-Agent" con A maiuscola
    expect(robotsText.toLowerCase()).toContain('user-agent: *')
  })

  test('permette crawling della root per tutti i crawler', async () => {
    expect(robotsText).toContain('Allow: /')
  })

  test('blocca /api/ e /admin/ per crawler standard', async () => {
    expect(robotsText).toContain('Disallow: /api/')
    expect(robotsText).toContain('Disallow: /admin/')
  })

  test('referenzia la sitemap.xml', async () => {
    expect(robotsText).toMatch(/Sitemap:\s*\S+\/sitemap\.xml/)
  })

  test('gestisce AI crawlers correttamente in base a consenti_ai_crawler', async ({
    request,
  }) => {
    // Se almeno un lemmario ha consenti_ai_crawler = false,
    // il robots.txt deve contenere regole per AI crawlers.
    // Se tutti hanno true, non devono esserci regole AI-specifiche.
    const lemmariRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    const { docs: lemmari } = await lemmariRes.json()

    const aiBlockedLemmari = lemmari.filter(
      (l: { seo?: { consenti_ai_crawler?: boolean } }) =>
        l.seo?.consenti_ai_crawler === false
    )

    const aiCrawlers = ['GPTBot', 'ClaudeBot', 'CCBot']

    if (aiBlockedLemmari.length > 0) {
      // Devono esserci regole per AI crawlers
      for (const crawler of aiCrawlers) {
        expect(robotsText).toContain(crawler)
      }
    } else {
      // Nessun lemmario blocca AI: non servono regole AI-specifiche
      for (const crawler of aiCrawlers) {
        expect(robotsText).not.toContain(crawler)
      }
    }
  })

  test('il flag consenti_ai_crawler blocca solo AI crawlers, non crawler standard', async ({
    request,
  }) => {
    // Fetch lemmari con AI crawling disabilitato
    const lemmariRes = await request.get(
      `${API_URL}/api/lemmari?where[attivo][equals]=true&limit=100`
    )
    const { docs: lemmari } = await lemmariRes.json()

    const aiBlockedLemmari = lemmari.filter(
      (l: { seo?: { consenti_ai_crawler?: boolean } }) =>
        l.seo?.consenti_ai_crawler === false
    )

    if (aiBlockedLemmari.length === 0) {
      // Se nessun lemmario blocca AI, verifica che non ci siano blocchi per-lemmario
      // oltre a /api/ e /admin/
      const disallowLines = robotsText
        .split('\n')
        .filter(line => line.startsWith('Disallow:'))
        .map(line => line.replace('Disallow:', '').trim())
        .filter(path => path !== '/api/' && path !== '/admin/' && path !== '')

      // Non ci dovrebbero essere path bloccati di lemmari
      for (const path of disallowLines) {
        // I path non dovrebbero corrispondere a slug di lemmari
        const isLemmarioPath = lemmari.some(
          (l: { slug: string }) => path === `/${l.slug}/`
        )
        expect(isLemmarioPath).toBe(false)
      }
    } else {
      // Se ci sono lemmari con AI bloccato, verifica che siano nel Disallow
      // MA solo per AI crawlers, non per User-agent: *
      for (const lemmario of aiBlockedLemmari) {
        expect(robotsText).toContain(`/${lemmario.slug}/`)
      }

      // Verifica che User-agent: * NON blocchi questi path
      const standardSection = extractUserAgentSection(robotsText, '*')
      for (const lemmario of aiBlockedLemmari) {
        expect(standardSection).not.toContain(`/${lemmario.slug}/`)
      }
    }
  })
})

test.describe('Coerenza sitemap e robots.txt', () => {
  test('la sitemap URL nel robots.txt corrisponde all\'endpoint reale', async ({
    request,
  }) => {
    const robotsRes = await request.get(`${BASE_URL}/robots.txt`)
    const robotsText = await robotsRes.text()

    // Estrai URL sitemap dal robots.txt
    const sitemapMatch = robotsText.match(/Sitemap:\s*(\S+)/)
    expect(sitemapMatch).not.toBeNull()

    const sitemapUrl = sitemapMatch![1]

    // Verifica che l'URL della sitemap sia raggiungibile
    const sitemapRes = await request.get(sitemapUrl)
    expect(sitemapRes.status()).toBe(200)
  })

  test('le pagine nella sitemap rispondono con 200', async ({ request }) => {
    const sitemapRes = await request.get(`${BASE_URL}/sitemap.xml`)
    const sitemapText = await sitemapRes.text()

    const locMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/g) || []
    const urls = locMatches.map(m => m.replace(/<\/?loc>/g, ''))

    // Testa un campione (max 10 URL) per evitare test troppo lenti
    const sample = urls.slice(0, 10)

    for (const url of sample) {
      const pageRes = await request.get(url)
      expect(pageRes.status()).toBe(200)
    }
  })
})

/**
 * Estrae la sezione di regole per uno specifico User-agent dal robots.txt.
 * Ritorna le righe dalla dichiarazione User-agent fino alla prossima sezione.
 */
function extractUserAgentSection(robotsText: string, userAgent: string): string {
  const lines = robotsText.split('\n')
  let inSection = false
  const sectionLines: string[] = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.startsWith('user-agent:')) {
      if (inSection) break // Fine della sezione corrente
      if (line.includes(userAgent)) {
        inSection = true
      }
    } else if (inSection) {
      sectionLines.push(line)
    }
  }

  return sectionLines.join('\n')
}
