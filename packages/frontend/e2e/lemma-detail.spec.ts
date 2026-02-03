import { test, expect } from '@playwright/test'

test.describe('Pagina dettaglio lemma', () => {
  test.describe('Lemma Camerarius (senza ricorrenze)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/matematica/lemmi/camerarius-lat')
    })

    test('mostra il titolo del lemma', async ({ page }) => {
      // Usa getByRole per selezionare specificamente l'heading del lemma
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

    test('mostra il livello di razionalità in fondo alla card', async ({ page }) => {
      // Usa l'accento corretto
      const livelloSection = page.locator('text=Livello di razionalità')
      await expect(livelloSection).toBeVisible()

      // Verifica che il livello 6 sia menzionato (cerca specifico nel contesto del livello)
      const livelloNumero = page.locator('span.text-primary-700').filter({ hasText: '6.' })
      await expect(livelloNumero).toBeVisible()
    })

    test('ha il breadcrumb corretto', async ({ page }) => {
      await expect(page.locator('text=Home')).toBeVisible()
      await expect(page.locator('text=Lemmario di Matematica')).toBeVisible()
      await expect(page.locator('text=camerarius').last()).toBeVisible()
    })

    test('mostra il link per tornare ai lemmi', async ({ page }) => {
      const backLink = page.locator('text=Torna ai lemmi')
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
      // Cerchiamo una parte del testo della definizione
      const definizione = page.locator('text=/[Uu]fficiale/')
      await expect(definizione.first()).toBeVisible()
    })

    test('mostra la sezione ricorrenze', async ({ page }) => {
      const ricorrenze = page.locator('text=/[Rr]icorrenz/')
      await expect(ricorrenze.first()).toBeVisible()
    })

    test('mostra la fonte prima della citazione', async ({ page }) => {
      // Verifica che il titolo della fonte sia visibile
      const fonteTitolo = page.locator('text=Regulae')
      await expect(fonteTitolo.first()).toBeVisible()
    })

    test('mostra anno della fonte', async ({ page }) => {
      // Verifica che l\'anno sia visibile
      const fonteAnno = page.locator('text=/\\(1363\\)|\\(XIV secolo/')
      await expect(fonteAnno.first()).toBeVisible()
    })

    test('mostra il testo originale della citazione', async ({ page }) => {
      // Verifica che ci sia un testo di citazione con parole latine
      const citazione = page.locator('text=/firmamus|Visitatores/')
      await expect(citazione.first()).toBeVisible()
    })

    test('mostra il riferimento bibliografico completo', async ({ page }) => {
      const riferimento = page.locator('text=Riferimento bibliografico')
      await expect(riferimento.first()).toBeVisible()

      // Verifica contenuto del riferimento
      const riferimentoTesto = page.locator('text=Historiae Patriae Monumenta')
      await expect(riferimentoTesto.first()).toBeVisible()
    })

    test('mostra il livello di razionalità in fondo', async ({ page }) => {
      const livelloLabel = page.locator('text=Livello di razionalità')
      await expect(livelloLabel.first()).toBeVisible()
    })

    test('struttura corretta: fonte sopra citazione, livello in fondo', async ({ page }) => {
      // Verifica ordine degli elementi nella pagina
      const fonteTitolo = page.locator('text=Regulae').first()
      const citazione = page.locator('blockquote').first()
      const livello = page.locator('text=Livello di razionalità').first()

      // Tutti gli elementi devono essere visibili
      await expect(fonteTitolo).toBeVisible()
      await expect(citazione).toBeVisible()
      await expect(livello).toBeVisible()

      // Verifica l\'ordine verticale (fonte prima di citazione, livello alla fine)
      const fonteBound = await fonteTitolo.boundingBox()
      const citazioneBound = await citazione.boundingBox()
      const livelloBound = await livello.boundingBox()

      if (fonteBound && citazioneBound && livelloBound) {
        // La fonte deve essere sopra la citazione
        expect(fonteBound.y).toBeLessThan(citazioneBound.y)
        // Il livello deve essere dopo la citazione
        expect(livelloBound.y).toBeGreaterThan(citazioneBound.y)
      }
    })
  })
})
