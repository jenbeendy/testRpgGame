import { test, expect } from '@playwright/test'
import { loginAs, mockInventory, mockSkills, mockRecipes, mockPlayerRecipes } from './helpers'

test.describe('Dashboard', () => {
  test('inventory tab: display items & active tab', async ({ page }) => {
    await mockInventory(page)
    await mockSkills(page)
    await loginAs(page)

    // Verify inventory tab is active
    await expect(page.locator('button:has-text("Inventory")')).toHaveClass(/border-b-2/)

    // Check inventory item visible
    await expect(page.locator('text=Iron Ore')).toBeVisible()
  })

  test('recipes tab: display recipe list', async ({ page }) => {
    await mockRecipes(page)
    await mockPlayerRecipes(page, [1, 2])
    await mockSkills(page)
    await loginAs(page)

    // Click recipes tab
    await page.click('button:has-text("Recipes")')

    // Verify recipes visible
    await expect(page.locator('text=Iron Sword')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Steel Sword')).toBeVisible({ timeout: 5000 })
  })

  test('tab switching: navigate between tabs', async ({ page }) => {
    await mockInventory(page)
    await mockRecipes(page)
    await mockPlayerRecipes(page)
    await mockSkills(page)
    await loginAs(page)

    // Start at inventory
    await expect(page.locator('button:has-text("Inventory")')).toHaveClass(/border-b-2/)

    // Switch to recipes
    await page.click('button:has-text("Recipes")')
    await expect(page.locator('button:has-text("Recipes")')).toHaveClass(/border-b-2/)

    // Switch to crafting
    await page.click('button:has-text("Crafting")')
    await expect(page.locator('button:has-text("Crafting")')).toHaveClass(/border-b-2/)
  })

  test('logout: clear auth & redirect to login', async ({ page }) => {
    await mockSkills(page)
    await loginAs(page)

    // Verify logged in
    expect(page.url()).toContain('/dashboard')

    // Click logout
    await page.click('button:has-text("Logout")')

    // Redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')

    // Verify localStorage cleared
    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(token).toBeNull()
  })
})
