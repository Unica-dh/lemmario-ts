import { test, expect } from '@playwright/test'

test.describe('Pagina dettaglio lemma', () => {
  test.describe('Lemma Camerarius (senza ricorrenze)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/matematica/lemmi/camerarius-lat')
    })

    test('mostra il titolo del lemma', async ({ page }) => {
      const heading = page.getByRole('heading', { name: 'camerarius' })
      await expect(heading).toBeVisible()
    })

    test('mostra il badge tipo latino', async ({ page }) => {
      const badge = page.locator('text=Latino').first()
      await expect(badge).toBeVisible()
    })

    test('mostra la definizione con il testo corretto', async ({ page }) => {
      const definizione = page.locator('text=Figura nella corporazione')
      await expect(definizione).toBeVisible()
    })

    test('mostra il livello di razionalità', async ({ page }) => {
      const livelloLabel = page.locator('text=/Livello:/')
      await expect(livelloLabel.first()).toBeVisible()
    })

    test('mostra il link per tornare al glossario', async ({ page }) => {
      const backLink = page.locator('text=Torna al glossario')
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Lemma visitatores (con ricorrenze)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/matematica/lemmi/visitatores-lat')
    })

    test('mostra il titolo del lemma', async ({ page }) => {
      const heading = page.getByRole('heading', { name: 'visitatores' })
      await expect(heading).toBeVisible()
    })

    test('mostra il badge tipo latino', async ({ page }) => {
      const badge = page.locator('text=Latino').first()
      await expect(badge).toBeVisible()
    })

    test('mostra la definizione', async ({ page }) => {
      const definizione = page.locator('text=/[Uu]fficiale/')
      await expect(definizione.first()).toBeVisible()
    })

    test('mostra il testo originale della citazione tra guillemets', async ({ page }) => {
      const citazione = page.locator('text=/firmamus|Visitatores/')
      await expect(citazione.first()).toBeVisible()
    })

    test('mostra la fonte con shorthand_id', async ({ page }) => {
      const fonte = page.locator('text=/Leges_Genuenses/')
      await expect(fonte.first()).toBeVisible()
    })

    test('mostra il livello di razionalità', async ({ page }) => {
      const livelloLabel = page.locator('text=/Livello:/')
      await expect(livelloLabel.first()).toBeVisible()
    })

    test('struttura corretta: citazione con bordo sinistro', async ({ page }) => {
      // Le citazioni hanno un border-left come indicatore visivo
      const citazione = page.locator('.border-l-2').first()
      await expect(citazione).toBeVisible()

      // Livello è nell'header della definizione (sopra la citazione)
      const livello = page.locator('text=/Livello:/').first()
      await expect(livello).toBeVisible()

      const citazioneBound = await citazione.boundingBox()
      const livelloBound = await livello.boundingBox()

      if (citazioneBound && livelloBound) {
        expect(livelloBound.y).toBeLessThan(citazioneBound.y)
      }
    })
  })
})
