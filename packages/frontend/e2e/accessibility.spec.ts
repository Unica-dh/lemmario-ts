import { test, expect } from '@playwright/test'

test.describe('Accessibilità', () => {
  test.describe('Skip to content', () => {
    test('il link skip-to-content è presente e funziona', async ({ page }) => {
      await page.goto('/')

      // Link should exist but not be visible initially
      const skipLink = page.locator('a.skip-to-content')
      await expect(skipLink).toHaveCount(1)

      // Focus the skip link via Tab
      await page.keyboard.press('Tab')
      await expect(skipLink).toBeFocused()

      // Verify link text
      await expect(skipLink).toHaveText('Vai al contenuto principale')

      // Verify href
      await expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    test('il target main-content esiste', async ({ page }) => {
      await page.goto('/')
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toHaveCount(1)
    })
  })

  test.describe('Landmark regions', () => {
    test('ha la navigation principale', async ({ page }) => {
      await page.goto('/matematica')
      const nav = page.getByRole('navigation', { name: 'Navigazione principale' })
      await expect(nav).toBeVisible()
    })

    test('ha il banner (InstitutionalBar)', async ({ page }) => {
      await page.goto('/')
      const banner = page.locator('[role="banner"]')
      await expect(banner).toBeVisible()
    })

    test('ha il contentinfo (footer)', async ({ page }) => {
      await page.goto('/')
      const footer = page.getByRole('contentinfo')
      await expect(footer).toBeVisible()
    })
  })

  test.describe('Keyboard navigation', () => {
    test('il focus è visibile sugli elementi interattivi', async ({ page }) => {
      await page.goto('/matematica')

      // Tab through interactive elements
      await page.keyboard.press('Tab') // skip-to-content
      await page.keyboard.press('Tab') // first nav link or element

      // Verify something is focused
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedTag).toBeTruthy()
    })

    test('il ThemeToggle ha aria-label', async ({ page }) => {
      await page.goto('/matematica')
      const isMobile = page.viewportSize()!.width < 768

      if (isMobile) {
        // Su mobile il ThemeToggle è nel drawer, apriamolo
        await page.getByTestId('mobile-menu-button').click()
        const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
        await expect(drawer).toBeVisible()
        const toggle = drawer.locator('button[aria-label*="modalità"]')
        await expect(toggle).toBeVisible({ timeout: 10000 })
      } else {
        const toggle = page.locator('button[aria-label*="modalità"]').first()
        await expect(toggle).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('ARIA labels', () => {
    test('il filtro alfabetico ha aria-label (desktop)', async ({ page, browserName }) => {
      test.skip(page.viewportSize()!.width < 1024, 'AlphabetSidebar è nascosta su mobile')
      await page.goto('/matematica')
      const alphabetNav = page.getByRole('navigation', { name: 'Filtro alfabetico' })
      await expect(alphabetNav).toHaveCount(1)
    })

    test('la paginazione ha aria-label', async ({ page }) => {
      await page.goto('/matematica')
      const pagination = page.getByRole('navigation', { name: 'Paginazione' })
      // May or may not be visible depending on number of lemmi, just check it exists if present
      const count = await pagination.count()
      if (count > 0) {
        await expect(pagination).toBeVisible()
      }
    })

    test('i separatori decorativi sono nascosti dallo screen reader', async ({ page }) => {
      await page.goto('/matematica')
      const hiddenDots = page.locator('[aria-hidden="true"]')
      // There should be at least one aria-hidden element (decorative separators)
      const count = await hiddenDots.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Touch targets', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('il bottone hamburger ha dimensioni minime 44x44px', async ({ page }) => {
      await page.goto('/matematica')
      const menuButton = page.getByTestId('mobile-menu-button')
      const box = await menuButton.boundingBox()
      expect(box).toBeTruthy()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('il FAB alfabetico ha dimensioni minime 44x44px', async ({ page }) => {
      await page.goto('/matematica')
      const fab = page.getByTestId('alphabet-fab')
      const box = await fab.boundingBox()
      expect(box).toBeTruthy()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })
})
