import { test, expect } from '@playwright/test'
import { mockLogin, mockRegister } from './helpers'

test.describe('Authentication', () => {
  test('login success: fill form & navigate to dashboard', async ({ page }) => {
    await mockLogin(page, 200)

    await page.goto('/login')
    await page.fill('label:has-text("Email") + input', 'test@test.com')
    await page.fill('label:has-text("Password") + input', 'password123')
    await page.click('button:has-text("Login")')

    await page.waitForURL('/dashboard', { timeout: 5000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('login 401: show Invalid credentials error', async ({ page }) => {
    await mockLogin(page, 401)

    await page.goto('/login')
    await page.fill('label:has-text("Email") + input', 'wrong@test.com')
    await page.fill('label:has-text("Password") + input', 'wrongpass')
    await page.click('button:has-text("Login")')

    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('register success: create account & redirect to login', async ({ page }) => {
    await mockRegister(page, 201)

    await page.goto('/register')
    await page.fill('label:has-text("Email") + input', 'newuser@test.com')
    await page.fill('label:has-text("Username") + input', 'newuser')
    await page.fill('label:has-text("Password") + input', 'password123')
    await page.click('button:has-text("Register")')

    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('register conflict: show Email already exists error', async ({ page }) => {
    await mockRegister(page, 409)

    await page.goto('/register')
    await page.fill('label:has-text("Email") + input', 'existing@test.com')
    await page.fill('label:has-text("Username") + input', 'existing')
    await page.fill('label:has-text("Password") + input', 'password123')
    await page.click('button:has-text("Register")')

    await expect(page.locator('text=Email already exists')).toBeVisible({ timeout: 5000 })
  })

  test('auth guard: redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to /login if not authenticated
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
