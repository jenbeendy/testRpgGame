import { test, expect } from '@playwright/test'
import { loginAs, mockRecipes, mockCraft, mockSkills } from './helpers'

test.describe('Crafting', () => {
  test('craft success: execute craft & display success result', async ({ page }) => {
    await mockRecipes(page)
    await mockCraft(page, true)
    await mockSkills(page, { crafting_level: 10 })
    await loginAs(page, { crafting_level: 10 })

    // Navigate to crafting tab
    await page.click('button:has-text("Crafting")')

    // Select first recipe
    await page.click('button:has-text("Iron Sword")')

    // Start crafting
    await page.click('button:has-text("Start Crafting")')

    // Wait for result div
    await expect(page.locator('text=Crafted!')).toBeVisible({ timeout: 10000 })

    // Verify success styling (green)
    const resultDiv = page.locator('div').filter({ hasText: 'Crafted!' }).first()
    await expect(resultDiv).toHaveClass(/bg-green-900/)
  })

  test('craft failure: execute craft & display failure result', async ({ page }) => {
    await mockRecipes(page)
    await mockCraft(page, false)
    await mockSkills(page, { crafting_level: 10 })
    await loginAs(page, { crafting_level: 10 })

    // Navigate to crafting tab
    await page.click('button:has-text("Crafting")')

    // Select first recipe
    await page.click('button:has-text("Iron Sword")')

    // Start crafting
    await page.click('button:has-text("Start Crafting")')

    // Wait for result div
    await expect(page.locator('text=Failed!')).toBeVisible({ timeout: 10000 })

    // Verify failure styling (red)
    const resultDiv = page.locator('div').filter({ hasText: 'Failed!' }).first()
    await expect(resultDiv).toHaveClass(/bg-red-900/)
  })

  test('no recipe selected: show placeholder message', async ({ page }) => {
    await mockRecipes(page)
    await mockSkills(page, { crafting_level: 10 })
    await loginAs(page, { crafting_level: 10 })

    // Navigate to crafting tab
    await page.click('button:has-text("Crafting")')

    // Verify placeholder visible (no recipe selected)
    await expect(page.locator('text=Select a recipe to begin crafting')).toBeVisible()

    // Verify no craft button visible
    await expect(page.locator('button:has-text("Start Crafting")')).not.toBeVisible()
  })
})
