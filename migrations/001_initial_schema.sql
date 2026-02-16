-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    crafting_skill_level INT DEFAULT 1,
    crafting_xp BIGINT DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item templates (static definitions)
CREATE TABLE item_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- weapon, armor, material, consumable, etc
    rarity VARCHAR(50) NOT NULL, -- common, uncommon, rare, epic, legendary
    base_durability INT NOT NULL DEFAULT 100,
    repair_cost INT DEFAULT 0,
    repair_materials JSONB DEFAULT '{}', -- {material_id: quantity}
    properties JSONB DEFAULT '{}', -- flexible attributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventories (containers)
CREATE TABLE inventories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    max_slots INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items (instances)
CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    item_template_id BIGINT NOT NULL REFERENCES item_templates(id),
    quantity INT DEFAULT 1,
    slot_x INT,
    slot_y INT,
    current_durability INT DEFAULT 100,
    last_decay_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, slot_x, slot_y)
);

-- Recipes (crafting formulas)
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    result_item_id BIGINT NOT NULL REFERENCES item_templates(id),
    success_rate INT DEFAULT 100, -- 0-100%
    required_skill_level INT DEFAULT 1,
    crafting_time_ms INT DEFAULT 1000, -- 1-5 seconds
    chain_step INT DEFAULT 1, -- 1-3 for depth tracking
    discoverable BOOLEAN DEFAULT FALSE, -- experimental crafting
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe ingredients
CREATE TABLE recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    item_template_id BIGINT NOT NULL REFERENCES item_templates(id),
    quantity INT DEFAULT 1,
    position INT NOT NULL, -- order matters (0-4 for max 5 ingredients)
    optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe hints (partial info for undiscovered recipes)
CREATE TABLE recipe_hints (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
    hint TEXT NOT NULL, -- e.g., "Combine fire + metal..."
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player recipes (discovered recipes per user)
CREATE TABLE player_recipes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    times_crafted INT DEFAULT 0,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Crafting logs (audit trail)
CREATE TABLE crafting_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id),
    success BOOLEAN NOT NULL,
    xp_gained INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_inventory_user_id ON inventories(user_id);
CREATE INDEX idx_inventory_items_inventory_id ON inventory_items(inventory_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_player_recipes_user_id ON player_recipes(user_id);
CREATE INDEX idx_crafting_logs_user_id ON crafting_logs(user_id);
CREATE INDEX idx_crafting_logs_created_at ON crafting_logs(created_at);
