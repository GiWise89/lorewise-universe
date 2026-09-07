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
