import { test, expect } from '@playwright/test'

test.describe('Mobile Menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/matematica')
  })

  test('mostra il bottone hamburger su mobile', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await expect(menuButton).toBeVisible()
  })

  test('apre il drawer al click del bottone hamburger', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer).toBeVisible()
  })

  test('mostra i link di navigazione nel drawer', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()

    await expect(page.getByRole('dialog').getByText('Dizionari')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Bibliografia')).toBeVisible()
  })

  test('chiude il drawer al click della X', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()
    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer).toBeVisible()

    const closeButton = page.getByTestId('mobile-menu-close')
    await expect(closeButton).toBeVisible()
    await closeButton.click()
    await expect(drawer).not.toBeVisible()
  })

  test('chiude il drawer con Escape', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()
    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
  })

  test('chiude il drawer al click sull overlay', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()
    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer).toBeVisible()

    // Click overlay (left side, away from the drawer which slides from right)
    await page.mouse.click(50, 400)
    await expect(drawer).not.toBeVisible()
  })

  test('mostra ThemeToggle nel drawer', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()

    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer.getByText('Tema')).toBeVisible()
  })

  test('naviga al click di un link e chiude il drawer', async ({ page }) => {
    await page.getByTestId('mobile-menu-button').click()

    const dizionariLink = page.getByRole('dialog').getByText('Dizionari')
    await dizionariLink.click()

    // Drawer should be closed
    const drawer = page.getByRole('dialog', { name: 'Menu di navigazione' })
    await expect(drawer).not.toBeVisible()
  })

  test('il menu desktop e nascosto su mobile', async ({ page }) => {
    // Desktop nav links should be hidden
    const desktopNav = page.locator('.hidden.md\\:flex')
    await expect(desktopNav).not.toBeVisible()
  })
})
