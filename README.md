# RPG Crafting Game

Browser-based MTG-inspired crafting game. Single/multiplayer-ready architecture targeting 100-500 concurrent users.

## Tech Stack

- **Backend:** Go microservices (Chi router, PostgreSQL, Redis)
- **Frontend:** React + TypeScript, Vite, TailwindCSS, React Query
- **Database:** PostgreSQL (primary), Redis (sessions/caching)
- **Auth:** JWT, Argon2 password hashing
- **Container:** Docker Compose (dev), production-ready for single VPS
- **Testing:** Go testify, testcontainers, Vitest, Playwright, k6

## Project Structure

```
.
├── services/
│   ├── auth-service/          # Registration, login, JWT, sessions
│   ├── crafting-service/       # Recipe management, crafting logic, skill tracking
│   ├── inventory-service/      # Item CRUD, durability, repairs
│   └── admin-service/          # Admin recipe/item templates CRUD
├── pkg/models/                 # Shared models (users, items, recipes)
├── migrations/                 # PostgreSQL schema
├── frontend/                   # React app (TypeScript, Tailwind, Vite)
└── docker-compose.yml          # Dev environment
```

## Database Schema

**Core tables:**
- `users`: auth + crafting skills
- `item_templates`: static item definitions (JSONB properties)
- `inventories` + `inventory_items`: player items w/ durability tracking
- `recipes` + `recipe_ingredients`: crafting formulas (max 5 ingredients, max 3-step chains)
- `recipe_hints`: hints for undiscovered recipes
- `player_recipes`: discovered recipes per user
- `crafting_logs`: audit trail

**Key features:**
- Durability system (time-based decay + usage decay)
- Dual repair (materials OR kits)
- Exponential skill leveling (XP = 100 × level^1.5)
- Recipe discovery (experimental crafting)
- Skill-based success rates (+1% per skill level above requirement)

## API Endpoints

### Auth
- `POST /auth/register` - register new user
- `POST /auth/login` - login, returns JWT tokens
- `POST /auth/refresh` - refresh access token
- `GET /auth/me` - get current user (authenticated)

### Inventory
- `GET /inventory/:userId` - list items
- `POST /inventory/:userId/items` - add item
- `DELETE /inventory/:userId/items/:itemId` - remove item
- `PATCH /inventory/:userId/items/:itemId` - move item to slot
- `POST /inventory/:userId/items/:itemId/repair` - repair item

### Crafting
- `GET /recipes` - list all recipes
- `GET /recipes/:id` - get recipe details
- `GET /recipes/:id/hint` - get hint for undiscovered recipe
- `POST /craft` - execute crafting
- `GET /player-recipes/:userId` - user's discovered recipes
- `POST /discover-recipe` - discover new recipe
- `GET /skills/:userId` - get crafting level + XP

### Admin (requires is_admin=true)
- `POST /admin/recipes` - create recipe
- `POST /admin/items` - create item template
- `DELETE /admin/recipes/:id` - delete recipe
- `DELETE /admin/items/:id` - delete item

## Phase Status

### Phase 1: Foundation ✅
- Go modules initialized
- PostgreSQL schema with migrations
- Auth service (register, login, JWT)
- Shared pkg/models
- Docker Compose setup

### Phase 2: Core Services ✅
- Inventory service (CRUD, slot management, durability tracking)
- Crafting service (recipe validation, execution, success rates, skill tracking)
- Frontend scaffold (React routing, auth context, TailwindCSS)
- Basic UI pages (Login, Register, Dashboard)

### Phase 3: Crafting Mechanics (IN PROGRESS)
- [ ] Seed 30-50 recipes in DB
- [ ] Recipe book UI (desktop, drag-drop)
- [ ] Positional recipe logic
- [ ] Success/failure mechanics with skill modifiers
- [ ] Recipe discovery system
- [ ] Durability decay and repair mechanics

### Phase 4: Admin Tools
- [ ] Admin recipe editor UI
- [ ] Item template management UI
- [ ] Ingredient editor with position support

### Phase 5: Testing & Polish
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests with testcontainers
- [ ] E2E tests with Playwright
- [ ] Load testing with k6
- [ ] Performance optimization
- [ ] Documentation

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Go 1.22+ (optional, for local dev)
- Node.js 18+ (for frontend dev)

### Dev Environment

```bash
# Start all services
docker-compose up -d

# DB migrations run automatically on container start
# Services: auth (8001), crafting (8002), inventory (8003), admin (8004)

# Frontend dev
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### Testing

```bash
# Auth service tests
cd services/auth-service
go test ./... -v

# Frontend tests
cd frontend
npm run test
npm run test:e2e
```

## Key Implementation Details

### Crafting Flow
1. User selects recipe (positional ingredients matter)
2. System verifies ingredients + skill level
3. Show progress bar (1-5s based on recipe complexity)
4. Roll success check (base % + skill modifier)
5. On success: consume ingredients, add result to inventory, grant XP
6. On failure: partial/total loss based on recipe

### Durability System
- Time-based decay: items lose durability over time (hourly decay check)
- Repair options:
  - Material repair: consume same materials as recipe (50% cost)
  - Repair kit: consumable item with flat restoration
  - Both available, player choice

### Skill Progression
- Exponential XP curve: XP_needed = 100 × (level^1.5)
- XP gain per craft: 10 + (recipe_skill_level × 5), halved on failure
- Skill modifier: +1% success rate per level above recipe requirement

### Recipe Discovery
- Marked as "discoverable" in DB
- Experimental crafting: try ingredient combos, discover on success
- Recipe hints visible when within 2 levels of requirement

## Future Enhancements (v1.1+)

- Multi-step recipe chains (ore → ingot → blade → sword)
- Tool requirements (forge for weapons, etc)
- Advanced item properties (enchantments, affixes)
- Crafting animations + better UX
- Multiplayer trading + collaborative crafting
- Leaderboards + achievements
- Real-time updates via WebSocket

## Notes

- All services use parameterized queries to prevent SQL injection
- JWT tokens: 15min access, 7day refresh
- Password hashing: Argon2 with secure defaults
- Admin actions require is_admin flag in users table
- Horizontal scaling ready: services stateless, PostgreSQL centralized
- Currently sized for single VPS (100-500 users); K8s not needed yet
