import assert from "node:assert/strict";
import test from "node:test";

import { translateSqliteSql } from "../lib/netlifySql.ts";

test("traduce json_extract di SQLite per il database PostgreSQL di Netlify", () => {
  const translated = translateSqliteSql(
    "SELECT CAST(json_extract(f.state_json, '$.level') AS INTEGER) AS familiar_level FROM nexus_familiars f",
  );

  assert.equal(
    translated.sql,
    "SELECT CAST((f.state_json::jsonb ->> 'level') AS INTEGER) AS familiar_level FROM nexus_familiars f",
  );
  assert.equal(translated.ignoredBindings, false);
});

test("traduce il controllo parametrico delle tabelle SQLite per Netlify", () => {
  const translated = translateSqliteSql(
    "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
  );

  assert.equal(
    translated.sql,
    "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1",
  );
  assert.equal(translated.ignoredBindings, false);
});
