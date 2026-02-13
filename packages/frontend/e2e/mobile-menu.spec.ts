import { test, expect } from '@playwright/test'

test.describe('Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/matematica')
  })

  test('mostra il pulsante hamburger menu su mobile', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await expect(menuButton).toBeVisible()
  })

  test('apre il drawer quando si clicca sul pulsante hamburger', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    // Verifica che il drawer sia visibile
    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer).toBeVisible()
  })

  test('mostra i link di navigazione nel drawer', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    // Verifica che i link siano presenti
    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer.getByText('Dizionari')).toBeVisible()
    await expect(drawer.getByText('Bibliografia')).toBeVisible()
  })

  test('chiude il drawer quando si clicca sul pulsante di chiusura', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer).toBeVisible()

    const closeButton = page.getByTestId('mobile-menu-close')
    await closeButton.click()

    // Verifica che il drawer non sia più visibile
    await expect(drawer).not.toBeVisible()
  })

  test('chiude il drawer quando si clicca sull\'overlay', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer).toBeVisible()

    // Clicca sull'overlay (fuori dal drawer)
    const overlay = page.getByTestId('mobile-menu-overlay')
    await overlay.click({ position: { x: 10, y: 10 } })

    // Verifica che il drawer non sia più visibile
    await expect(drawer).not.toBeVisible()
  })

  test('chiude il drawer quando si preme Escape', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer).toBeVisible()

    // Premi Escape
    await page.keyboard.press('Escape')

    // Verifica che il drawer non sia più visibile
    await expect(drawer).not.toBeVisible()
  })

  test('chiude il drawer quando si clicca su un link', async ({ page }) => {
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()

    const drawer = page.getByTestId('mobile-menu-drawer')
    await expect(drawer).toBeVisible()

    // Clicca su un link
    await drawer.getByText('Dizionari').click()

    // Verifica che il drawer non sia più visibile
    await expect(drawer).not.toBeVisible()
  })

  test('non mostra il pulsante hamburger su desktop', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/matematica')

    const menuButton = page.getByTestId('mobile-menu-button')
    await expect(menuButton).not.toBeVisible()
  })
})
