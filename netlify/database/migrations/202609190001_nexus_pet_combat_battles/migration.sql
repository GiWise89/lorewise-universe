-- Registro permanente delle battaglie del Famiglio verificate dal server
-- (vedi lib/famiglioCombatServer.ts, creata anche a runtime con IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS nexus_pet_combat_battles (
  customer_id TEXT NOT NULL,
  house_index INTEGER NOT NULL,
  battle_id TEXT NOT NULL,
  familiar_id TEXT NOT NULL,
  encounter_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reward_key TEXT,
  combat_xp INTEGER NOT NULL DEFAULT 0,
  nexus_coins INTEGER NOT NULL DEFAULT 0,
  night_sigils INTEGER NOT NULL DEFAULT 0,
  relic_fragments INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Chiave composta invece di una colonna automatica: la stessa istruzione vale su
  -- PostgreSQL (Netlify) e su SQLite, e impedisce di registrare due volte una battaglia.
  PRIMARY KEY (customer_id, house_index, battle_id)
);

CREATE INDEX IF NOT EXISTS nexus_pet_combat_battles_reward_idx ON nexus_pet_combat_battles(customer_id, house_index, reward_key);
CREATE INDEX IF NOT EXISTS nexus_pet_combat_battles_battle_idx ON nexus_pet_combat_battles(customer_id, house_index, battle_id);
