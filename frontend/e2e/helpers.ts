import { Page } from '@playwright/test'

export interface TestUser {
  id: number
  email: string
  username: string
  is_admin: boolean
  crafting_level?: number
}

/**
 * Set localStorage directly with auth credentials & navigate to dashboard
 */
export async function loginAs(page: Page, user?: Partial<TestUser>) {
  const defaultUser: TestUser = {
    id: 1,
    email: 'test@test.com',
    username: 'testuser',
    is_admin: false,
    crafting_level: 10,
  }
  const merged = { ...defaultUser, ...user }

  await page.evaluate((u) => {
    localStorage.setItem('access_token', 'fake-token-' + u.id)
    localStorage.setItem('user', JSON.stringify(u))
  }, merged)

  await page.goto('/dashboard')
}

/**
 * Mock POST /api/auth/login
 */
export async function mockLogin(page: Page, status: number = 200) {
  await page.route('**/api/auth/login', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status,
        body: JSON.stringify(
          status === 200
            ? { access_token: 'fake-token' }
            : { message: 'Invalid credentials' }
        ),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock POST /api/auth/register
 */
export async function mockRegister(page: Page, status: number = 201) {
  if (status === 201) {
    await page.route('**/api/auth/register', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          body: JSON.stringify({ message: 'User created' }),
        })
      } else {
        route.continue()
      }
    })
  } else if (status === 409) {
    await page.route('**/api/auth/register', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          body: JSON.stringify({ message: 'Email already exists' }),
        })
      } else {
        route.continue()
      }
    })
  }
}

/**
 * Mock GET /api/inventory/*
 */
export async function mockInventory(page: Page) {
  await page.route('**/api/inventory/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [
            {
              id: 1,
              item_template_id: 1,
              quantity: 5,
              slot_x: 0,
              slot_y: 0,
              current_durability: 100,
              max_durability: 100,
              name: 'Iron Ore',
            },
          ],
        }),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock GET /api/recipes
 */
export async function mockRecipes(page: Page) {
  await page.route('**/api/recipes', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 1,
            name: 'Iron Sword',
            description: 'A basic iron sword',
            required_skill_level: 1,
            success_rate: 80,
            crafting_time_ms: 2000,
          },
          {
            id: 2,
            name: 'Steel Sword',
            description: 'A strong steel sword',
            required_skill_level: 5,
            success_rate: 70,
            crafting_time_ms: 3000,
          },
        ]),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock GET /api/skills/*
 */
export async function mockSkills(page: Page, overrides?: any) {
  await page.route('**/api/skills/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          crafting_level: 10,
          crafting_xp: 50,
          xp_for_next_level: 100,
          ...overrides,
        }),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock POST /api/craft
 */
export async function mockCraft(page: Page, success: boolean = true) {
  await page.route('**/api/craft', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success,
          message: success ? 'Crafted!' : 'Failed!',
          xp: success ? 10 : 0,
        }),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock GET /api/player-recipes/*
 */
export async function mockPlayerRecipes(page: Page, recipeIds: number[] = [1]) {
  await page.route('**/api/player-recipes/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        body: JSON.stringify(recipeIds),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock GET /api/recipes/[id]/hint
 */
export async function mockRecipeHint(page: Page, hint: string = 'Try adding iron ore') {
  await page.route('**/api/recipes/*/hint', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ hint }),
      })
    } else {
      route.continue()
    }
  })
}
