-- Add gold to users and gathering/shop tables
ALTER TABLE users ADD COLUMN gold BIGINT DEFAULT 100 NOT NULL;

CREATE TABLE gather_cooldowns (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone VARCHAR(50) NOT NULL,
    last_gather_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, zone)
);

CREATE INDEX idx_gather_cooldowns_user_id ON gather_cooldowns(user_id);
