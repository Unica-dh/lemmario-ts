import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test.describe('Desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('mostra la navigazione desktop', async ({ page }) => {
      await page.goto('/matematica')
      const desktopNav = page.locator('.hidden.md\\:flex').first()
      await expect(desktopNav).toBeVisible()
    })

    test('nasconde il bottone hamburger', async ({ page }) => {
      await page.goto('/matematica')
      const menuButton = page.getByTestId('mobile-menu-button')
      await expect(menuButton).not.toBeVisible()
    })

    test('mostra la sidebar alfabetica', async ({ page }) => {
      await page.goto('/matematica')
      const sidebar = page.getByTestId('alphabet-sidebar')
      await expect(sidebar).toBeVisible()
    })

    test('nasconde il FAB alfabetico', async ({ page }) => {
      await page.goto('/matematica')
      const fab = page.getByTestId('alphabet-fab')
      await expect(fab).not.toBeVisible()
    })
  })

  test.describe('Mobile (390px)', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('mostra il bottone hamburger', async ({ page }) => {
      await page.goto('/matematica')
      const menuButton = page.getByTestId('mobile-menu-button')
      await expect(menuButton).toBeVisible()
    })

    test('nasconde la navigazione desktop', async ({ page }) => {
      await page.goto('/matematica')
      const desktopNav = page.locator('.hidden.md\\:flex').first()
      await expect(desktopNav).not.toBeVisible()
    })

    test('mostra il FAB alfabetico', async ({ page }) => {
      await page.goto('/matematica')
      const fab = page.getByTestId('alphabet-fab')
      await expect(fab).toBeVisible()
    })

    test('nasconde la sidebar alfabetica', async ({ page }) => {
      await page.goto('/matematica')
      const sidebar = page.getByTestId('alphabet-sidebar')
      await expect(sidebar).not.toBeVisible()
    })

    test('il titolo usa font-size ridotto su mobile', async ({ page }) => {
      await page.goto('/matematica')
      const heading = page.getByRole('heading', { level: 1 })
      const fontSize = await heading.evaluate((el) => window.getComputedStyle(el).fontSize)
      const fontSizePx = parseFloat(fontSize)
      // text-3xl = 1.875rem = 30px at default, text-5xl = 3rem = 48px
      // On mobile should be text-3xl (30px), not text-5xl
      expect(fontSizePx).toBeLessThanOrEqual(36)
    })
  })

  test.describe('Homepage responsive', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('il titolo Glossario usa font-size ridotto su mobile', async ({ page }) => {
      await page.goto('/')
      const heading = page.getByRole('heading', { name: 'Glossario', exact: true })
      const fontSize = await heading.evaluate((el) => window.getComputedStyle(el).fontSize)
      const fontSizePx = parseFloat(fontSize)
      // text-3xl = 30px on mobile
      expect(fontSizePx).toBeLessThanOrEqual(36)
    })
  })
})
