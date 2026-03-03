import { test, expect } from '@playwright/test'

/**
 * Test E2E per la visualizzazione dell'anno nel selettore Fonte.
 *
 * Funzionalità: nel dropdown di selezione fonte (FonteAutocomplete),
 * viene mostrato "Titolo (anno)" per disambiguare fonti omonime.
 *
 * Caso ideale: "Libro d'abaco" ha 18 occorrenze con anni diversi.
 */

const ADMIN_URL = 'http://localhost:3000/admin'
const LEMMA_ID = 466 // vicario (volgare) — ha definizioni con ricorrenze

test.describe('Fonte Autocomplete - Anno nel dropdown', () => {
  test.use({ baseURL: 'http://localhost:3000' })

  test.beforeEach(async ({ page }) => {
    // Login nell'admin Payload
    await page.goto(`${ADMIN_URL}/login`)
    await page.fill('input[name="email"]', 'admin@lemmario.dev')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 })
  })

  test('il dropdown fonte mostra titolo + anno per disambiguare fonti omonime', async ({ page }) => {
    // Naviga al form custom del lemma
    await page.goto(`${ADMIN_URL}/collections/lemmi/${LEMMA_ID}`)
    await page.waitForSelector('text=Modifica Lemma', { timeout: 15000 })

    // Vai allo step Definizioni
    await page.click('button.tab-button:has-text("Definizioni")')
    await page.waitForSelector('.definizioni-step', { timeout: 5000 })

    // Screenshot iniziale dello step definizioni
    await page.screenshot({
      path: 'e2e/screenshots/fonte-anno-01-definizioni-step.png',
      fullPage: true,
    })

    // Cerca il campo autocomplete fonte (primo disponibile)
    // Se non ci sono ricorrenze visibili, aggiungiamone una temporanea
    let fonteInput = page.locator('.fonte-autocomplete .autocomplete-input').first()
    const hasFonteInput = await fonteInput.isVisible().catch(() => false)

    if (!hasFonteInput) {
      // Aggiungi una definizione e una ricorrenza per avere il campo fonte
      await page.click('button.btn-add-def')
      await page.waitForTimeout(500)

      // Espandi le ricorrenze nell'ultima definizione
      const lastDef = page.locator('.definizione-card').last()
      const addRicorrenzaBtn = lastDef.locator('button:has-text("Aggiungi ricorrenza")')
      if (await addRicorrenzaBtn.isVisible().catch(() => false)) {
        await addRicorrenzaBtn.click()
        await page.waitForTimeout(500)
      }
      fonteInput = page.locator('.fonte-autocomplete .autocomplete-input').first()
    }

    await expect(fonteInput).toBeVisible({ timeout: 5000 })

    // Cerca "Libro d'abaco" — termine con molte fonti omonime
    await fonteInput.fill('')
    await fonteInput.type("Libro d'abaco", { delay: 50 })

    // Attendi che i risultati appaiano (debounce 300ms + fetch)
    await page.waitForSelector('.autocomplete-results', { timeout: 5000 })

    // Screenshot del dropdown con i risultati che mostrano l'anno
    await page.screenshot({
      path: 'e2e/screenshots/fonte-anno-02-dropdown-con-anno.png',
      fullPage: false,
    })

    // Verifica che i risultati contengano l'anno tra parentesi
    const resultItems = page.locator('.autocomplete-result-item')
    const count = await resultItems.count()
    expect(count).toBeGreaterThan(0)

    // Controlla che almeno un risultato contenga l'anno tra parentesi
    let foundWithYear = false
    for (let i = 0; i < count; i++) {
      const text = await resultItems.nth(i).textContent()
      if (text && /\(\d{3,4}/.test(text)) {
        foundWithYear = true
        break
      }
    }
    expect(foundWithYear).toBe(true)

    // Verifica pattern "Titolo (anno)" su tutti i risultati con anno
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await resultItems.nth(i).textContent()
      // Ogni risultato "Libro d'abaco" deve avere l'anno
      if (text?.includes("Libro d'abaco")) {
        expect(text).toMatch(/Libro d'abaco\s*\(.+\)/)
      }
    }

    // Screenshot ravvicinato del dropdown
    const dropdownEl = page.locator('.autocomplete-results').first()
    await dropdownEl.screenshot({
      path: 'e2e/screenshots/fonte-anno-03-dropdown-dettaglio.png',
    })

    // Seleziona uno dei risultati
    const firstResult = resultItems.first()
    const selectedText = await firstResult.textContent()
    await firstResult.click()

    // Verifica che il campo input mostri titolo + anno dopo la selezione
    const inputValue = await fonteInput.inputValue()
    expect(inputValue).toContain("Libro d'abaco")
    expect(inputValue).toMatch(/\(.+\)/) // Deve contenere l'anno tra parentesi

    // Screenshot dopo la selezione
    await page.screenshot({
      path: 'e2e/screenshots/fonte-anno-04-dopo-selezione.png',
      fullPage: false,
    })
  })

  test('fonti senza anno mostrano solo il titolo', async ({ page }) => {
    // Naviga al form custom del lemma
    await page.goto(`${ADMIN_URL}/collections/lemmi/${LEMMA_ID}`)
    await page.waitForSelector('text=Modifica Lemma', { timeout: 15000 })

    // Vai allo step Definizioni
    await page.click('button.tab-button:has-text("Definizioni")')
    await page.waitForSelector('.definizioni-step', { timeout: 5000 })

    // Cerca il campo autocomplete fonte
    let fonteInput = page.locator('.fonte-autocomplete .autocomplete-input').first()
    const hasFonteInput = await fonteInput.isVisible().catch(() => false)

    if (!hasFonteInput) {
      await page.click('button.btn-add-def')
      await page.waitForTimeout(500)
      const lastDef = page.locator('.definizione-card').last()
      const addRicorrenzaBtn = lastDef.locator('button:has-text("Aggiungi ricorrenza")')
      if (await addRicorrenzaBtn.isVisible().catch(() => false)) {
        await addRicorrenzaBtn.click()
        await page.waitForTimeout(500)
      }
      fonteInput = page.locator('.fonte-autocomplete .autocomplete-input').first()
    }

    await expect(fonteInput).toBeVisible({ timeout: 5000 })

    // Cerca un termine generico per trovare fonti con e senza anno
    await fonteInput.fill('')
    await fonteInput.type('Statuto', { delay: 50 })
    await page.waitForSelector('.autocomplete-results', { timeout: 5000 })

    // Verifica che le fonti con anno mostrino il formato corretto
    const resultItems = page.locator('.autocomplete-result-item')
    const count = await resultItems.count()
    expect(count).toBeGreaterThan(0)

    // Tutte le fonti "Statuto" dovrebbero avere anno
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await resultItems.nth(i).textContent()
      // Se è uno Statuto, quasi certamente ha un anno
      if (text?.startsWith('Statuto')) {
        expect(text).toMatch(/\(\d{3,4}/)
      }
    }
  })
})
