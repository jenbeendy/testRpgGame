-- ============================================
-- ITEM TEMPLATES SEED DATA
-- ============================================

-- Basic Materials
INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties) VALUES
('Copper Ore', 'material', 'common', 100, 0, '{"weight": 1}'),
('Iron Ore', 'material', 'uncommon', 100, 0, '{"weight": 2}'),
('Gold Ore', 'material', 'rare', 100, 0, '{"weight": 1, "purity": 0.9}'),
('Mithril Ore', 'material', 'epic', 100, 0, '{"weight": 1, "purity": 0.95}'),
('Wood Log', 'material', 'common', 100, 0, '{"type": "oak", "quality": "low"}'),
('Oak Plank', 'material', 'common', 100, 0, '{"type": "oak"}'),
('Leather Scrap', 'material', 'common', 100, 0, '{"quality": "raw"}'),
('Fine Leather', 'material', 'uncommon', 100, 0, '{"quality": "treated"}'),
('Coal', 'material', 'common', 100, 0, '{"purity": 0.8}'),
('Charcoal', 'material', 'uncommon', 100, 0, '{"purity": 0.95}'),
('Water Essence', 'material', 'rare', 100, 0, '{"element": "water"}'),
('Fire Essence', 'material', 'rare', 100, 0, '{"element": "fire"}'),
('Earth Essence', 'material', 'rare', 100, 0, '{"element": "earth"}'),
('Air Essence', 'material', 'rare', 100, 0, '{"element": "air"}'),
('Crystal Shard', 'material', 'uncommon', 100, 0, '{"purity": 0.85}'),
('Pure Crystal', 'material', 'rare', 100, 0, '{"purity": 1.0}'),
('String', 'material', 'common', 100, 0, '{"length": 10}'),
('Rope', 'material', 'uncommon', 100, 0, '{"length": 50}'),
('Cloth', 'material', 'common', 100, 0, '{"type": "linen"}'),
('Silk Cloth', 'material', 'uncommon', 100, 0, '{"type": "silk", "quality": "premium"}');

-- Ingots & Processed Materials
INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties) VALUES
('Copper Ingot', 'material', 'common', 100, 0, '{"purity": 0.95}'),
('Iron Ingot', 'material', 'uncommon', 100, 0, '{"purity": 0.98}'),
('Gold Ingot', 'material', 'rare', 100, 0, '{"purity": 0.99}'),
('Mithril Ingot', 'material', 'epic', 100, 0, '{"purity": 1.0, "weight": 0.5}'),
('Steel Ingot', 'material', 'uncommon', 100, 0, '{"composition": "iron_carbon"}');

-- Weapons
INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties) VALUES
('Wooden Sword', 'weapon', 'common', 50, 5, '{"damage": 5, "type": "melee"}'),
('Iron Sword', 'weapon', 'uncommon', 80, 15, '{"damage": 15, "type": "melee"}'),
('Steel Sword', 'weapon', 'rare', 120, 25, '{"damage": 20, "type": "melee"}'),
('Mithril Sword', 'weapon', 'epic', 150, 50, '{"damage": 30, "type": "melee", "bonus": "magic"}'),
('Copper Dagger', 'weapon', 'common', 40, 3, '{"damage": 8, "type": "melee"}'),
('Iron Dagger', 'weapon', 'uncommon', 60, 10, '{"damage": 12, "type": "melee"}'),
('Wooden Bow', 'weapon', 'common', 40, 5, '{"damage": 10, "type": "ranged"}'),
('Iron Bow', 'weapon', 'uncommon', 70, 12, '{"damage": 18, "type": "ranged"}'),
('Enchanted Staff', 'weapon', 'rare', 100, 30, '{"damage": 15, "type": "magic", "element": "neutral"}');

-- Armor
INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties) VALUES
('Leather Helmet', 'armor', 'common', 60, 8, '{"defense": 5, "type": "head"}'),
('Iron Helmet', 'armor', 'uncommon', 100, 15, '{"defense": 12, "type": "head"}'),
('Leather Chest Plate', 'armor', 'common', 80, 10, '{"defense": 8, "type": "chest"}'),
('Iron Chest Plate', 'armor', 'uncommon', 120, 20, '{"defense": 18, "type": "chest"}'),
('Leather Leggings', 'armor', 'common', 70, 8, '{"defense": 6, "type": "legs"}'),
('Iron Leggings', 'armor', 'uncommon', 110, 15, '{"defense": 14, "type": "legs"}'),
('Leather Boots', 'armor', 'common', 50, 5, '{"defense": 3, "type": "feet"}'),
('Iron Boots', 'armor', 'uncommon', 80, 10, '{"defense": 8, "type": "feet"}');

-- Consumables & Special Items
INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties) VALUES
('Health Potion', 'consumable', 'common', 30, 0, '{"healing": 50}'),
('Greater Health Potion', 'consumable', 'uncommon', 30, 0, '{"healing": 150}'),
('Mana Potion', 'consumable', 'uncommon', 30, 0, '{"mana_restore": 100}'),
('Repair Kit', 'consumable', 'common', 20, 0, '{"repair_amount": 50, "universal": true}'),
('Blade', 'component', 'uncommon', 100, 0, '{"sharp": 1.0, "type": "sword"}'),
('Handle', 'component', 'uncommon', 100, 0, '{"grip": 0.8, "type": "sword"}');

-- ============================================
-- RECIPES SEED DATA
-- ============================================

-- Level 1: Basic Smelting & Processing (skill_req: 1)
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Smelt Copper', 'Basic smelting of copper ore into ingot', id, 95, 1, 2000, 1, false FROM item_templates WHERE name = 'Copper Ingot';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Copper Ore'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Coal'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Cut Planks', 'Process log into usable plank', id, 90, 1, 1500, 1, false FROM item_templates WHERE name = 'Oak Plank';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Wood Log'), 1, 0;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Refine Coal', 'Turn coal into charcoal', id, 85, 1, 1000, 1, true FROM item_templates WHERE name = 'Charcoal';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Coal'), 2, 0;

-- Level 2: Iron & Steel (skill_req: 2)
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Smelt Iron', 'Smelt iron ore with charcoal', id, 90, 2, 2500, 1, false FROM item_templates WHERE name = 'Iron Ingot';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ore'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Charcoal'), 2, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Steel', 'Combine iron ingots to create steel', id, 80, 2, 3000, 1, false FROM item_templates WHERE name = 'Steel Ingot';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 3, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Coal'), 1, 1;

-- Level 1-2: Basic Weapons
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Wooden Sword', 'Fashion a basic wooden sword', id, 95, 1, 2000, 1, false FROM item_templates WHERE name = 'Wooden Sword';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Oak Plank'), 2, 0;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Iron Sword', 'Smith an iron blade and handle', id, 75, 3, 4000, 2, false FROM item_templates WHERE name = 'Iron Sword';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Oak Plank'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Copper Dagger', 'Create a small copper blade', id, 85, 1, 1500, 1, false FROM item_templates WHERE name = 'Copper Dagger';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Copper Ingot'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Oak Plank'), 1, 1;

-- Level 4: Steel Weapons & Armor
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Steel Sword', 'Craft superior steel blade', id, 70, 4, 5000, 2, false FROM item_templates WHERE name = 'Steel Sword';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Steel Ingot'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 1, 1;

-- Level 1-2: Armor (skill_req: 2)
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Leather Helmet', 'Create protective leather helmet', id, 85, 2, 2500, 1, false FROM item_templates WHERE name = 'Leather Helmet';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'String'), 2, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Leather Chest Plate', 'Create leather body armor', id, 80, 2, 3000, 1, false FROM item_templates WHERE name = 'Leather Chest Plate';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 4, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Rope'), 1, 1;

-- Level 3: Iron Armor
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Iron Helmet', 'Hammer iron into protective helmet', id, 75, 3, 3500, 2, false FROM item_templates WHERE name = 'Iron Helmet';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 3, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Leather Helmet'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Iron Chest Plate', 'Forge heavy iron armor', id, 70, 3, 4000, 2, false FROM item_templates WHERE name = 'Iron Chest Plate';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 5, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Leather Chest Plate'), 1, 1;

-- Level 5: Rare & Advanced
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Smelt Gold', 'Smelt rare gold ore', id, 60, 5, 3000, 1, true FROM item_templates WHERE name = 'Gold Ingot';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Gold Ore'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Charcoal'), 3, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Smelt Mithril', 'Advanced smelting of mithril ore', id, 50, 6, 4000, 1, true FROM item_templates WHERE name = 'Mithril Ingot';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Mithril Ore'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Charcoal'), 5, 1;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Pure Crystal'), 1, 2;

-- Level 6: Epic Weapons
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Mithril Sword', 'Craft the legendary mithril blade', id, 60, 6, 5000, 3, true FROM item_templates WHERE name = 'Mithril Sword';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Mithril Ingot'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 1, 1;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Pure Crystal'), 1, 2;

-- Level 1: Ranged Weapons
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Wooden Bow', 'Fashion a basic wooden bow', id, 90, 1, 2000, 1, false FROM item_templates WHERE name = 'Wooden Bow';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Oak Plank'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Rope'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Iron Bow', 'Create reinforced iron bow', id, 75, 3, 3000, 2, false FROM item_templates WHERE name = 'Iron Bow';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Wooden Bow'), 1, 1;

-- Level 2-3: Potions & Consumables
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Brew Health Potion', 'Create basic healing potion', id, 80, 2, 1500, 1, false FROM item_templates WHERE name = 'Health Potion';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Water Essence'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Earth Essence'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Repair Kit', 'Assemble universal repair kit', id, 85, 2, 1000, 1, false FROM item_templates WHERE name = 'Repair Kit';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Steel Ingot'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Silk Cloth'), 1, 1;

-- Level 4: Rare Potions
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Brew Greater Health Potion', 'Create potent healing draught', id, 70, 4, 2500, 2, true FROM item_templates WHERE name = 'Greater Health Potion';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Health Potion'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fire Essence'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Brew Mana Potion', 'Brew mana restoring potion', id, 65, 4, 2000, 1, true FROM item_templates WHERE name = 'Mana Potion';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Water Essence'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Air Essence'), 1, 1;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Pure Crystal'), 1, 2;

-- Level 3-4: Leather & Accessories
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Tan Leather', 'Process raw hide into leather', id, 80, 2, 2000, 1, false FROM item_templates WHERE name = 'Fine Leather';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Leather Scrap'), 3, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Charcoal'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Weave Silk Cloth', 'Weave premium silk fabric', id, 70, 4, 2500, 1, true FROM item_templates WHERE name = 'Silk Cloth';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Cloth'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Air Essence'), 1, 1;

-- Level 5: Crystal Crafting
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Purify Crystal', 'Refine crystal shard into pure form', id, 60, 5, 3000, 1, true FROM item_templates WHERE name = 'Pure Crystal';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Crystal Shard'), 3, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Pure Crystal'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Enchanted Staff', 'Bind essences into magical staff', id, 50, 5, 4000, 2, true FROM item_templates WHERE name = 'Enchanted Staff';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Oak Plank'), 1, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Pure Crystal'), 2, 1;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fire Essence'), 1, 2;

-- Level 2: Boots & Legs
INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Leather Boots', 'Fashion protective leather boots', id, 85, 2, 2000, 1, false FROM item_templates WHERE name = 'Leather Boots';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 2, 0;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Craft Leather Leggings', 'Create leg protection from leather', id, 83, 2, 2200, 1, false FROM item_templates WHERE name = 'Leather Leggings';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Fine Leather'), 3, 0;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Iron Boots', 'Smith iron footwear', id, 72, 3, 2500, 2, false FROM item_templates WHERE name = 'Iron Boots';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 2, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Leather Boots'), 1, 1;

INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable)
SELECT 'Forge Iron Leggings', 'Craft iron leg armor', id, 70, 3, 2800, 2, false FROM item_templates WHERE name = 'Iron Leggings';
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Iron Ingot'), 3, 0;
INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position)
SELECT (SELECT MAX(id) FROM recipes), (SELECT id FROM item_templates WHERE name = 'Leather Leggings'), 1, 1;

-- ============================================
-- RECIPE HINTS FOR DISCOVERABLE RECIPES
-- ============================================

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Combine coal fragments in heat' FROM recipes WHERE name = 'Refine Coal';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Smelt rare golden ore at high temperature' FROM recipes WHERE name = 'Smelt Gold';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Legendary mithril requires special handling' FROM recipes WHERE name = 'Smelt Mithril';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Combine strong legendary blade components' FROM recipes WHERE name = 'Forge Mithril Sword';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Enhance basic potion with fire' FROM recipes WHERE name = 'Brew Greater Health Potion';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Blend water and air with crystal focus' FROM recipes WHERE name = 'Brew Mana Potion';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Refine multiple crystals into perfection' FROM recipes WHERE name = 'Purify Crystal';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Infuse staff with elemental power' FROM recipes WHERE name = 'Craft Enchanted Staff';

INSERT INTO recipe_hints (recipe_id, hint)
SELECT id, 'Transform cloth into finer material' FROM recipes WHERE name = 'Weave Silk Cloth';
