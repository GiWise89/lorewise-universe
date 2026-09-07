function replaceQuestionPlaceholders(sql: string) {
  let index = 0;
  let quote: "'" | '"' | "`" | null = null;
  let output = "";
  for (let cursor = 0; cursor < sql.length; cursor += 1) {
    const character = sql[cursor];
    if (quote) {
      output += character;
      if (character === quote && sql[cursor - 1] !== "\\") quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      output += character;
      continue;
    }
    if (character === "?") {
      index += 1;
      output += `$${index}`;
      continue;
    }
    output += character;
  }
  return output;
}

export function translateSqliteSql(source: string) {
  const sqliteTableLookup = source.trim().match(/^SELECT\s+1\s+AS\s+found\s+FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*'table'\s+AND\s+name\s*=\s*\?\s+LIMIT\s+1$/i);
  if (sqliteTableLookup) {
    return {
      sql: "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1",
      ignoredBindings: false,
    };
  }

  const sqliteTableList = source.trim().match(/^SELECT\s+name\s+FROM\s+sqlite_master\s+WHERE\s+type\s*=\s*'table'$/i);
  if (sqliteTableList) {
    return {
      sql: "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public'",
      ignoredBindings: true,
    };
  }

  const pragma = source.trim().match(/^PRAGMA\s+table_info\(([^)]+)\)$/i);
  if (pragma) {
    const table = pragma[1].replace(/["'`]/g, "");
    return {
      sql: `SELECT column_name AS name, ordinal_position - 1 AS cid, data_type AS type,
        CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        column_default AS dflt_value
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table.replace(/'/g, "''")}'
        ORDER BY ordinal_position`,
      ignoredBindings: true,
    };
  }

  let sql = source
    .replace(/`/g, '"')
    .replace(/\bDEFAULT\s+false\b/gi, "DEFAULT 0")
    .replace(/\bDEFAULT\s+true\b/gi, "DEFAULT 1")
    .replace(
      /\bjson_extract\(\s*([a-zA-Z_][\w.]*)\s*,\s*'\$\.([a-zA-Z_][\w]*)'\s*\)/gi,
      "($1::jsonb ->> '$2')",
    )
    .replace(/\bdatetime\(\s*'now'\s*,\s*\?\s*\)/gi, "(CURRENT_TIMESTAMP + (?::interval))")
    .replace(/\bdatetime\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi, "(CURRENT_TIMESTAMP + INTERVAL '$1')")
    .replace(/\bdatetime\(\s*([a-zA-Z_][\w.]*)\s*\)/gi, "NULLIF($1, '')::timestamptz")
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/printf\(\s*'%.2f'\s*,\s*([^\)]+)\)/gi, "to_char($1, 'FM999999990.00')");

  const wasInsertOrIgnore = /\bINSERT\s+OR\s+IGNORE\s+INTO\b/i.test(source);
  if (wasInsertOrIgnore && !/\bON\s+CONFLICT\b/i.test(sql)) {
    sql = `${sql.replace(/;\s*$/, "")} ON CONFLICT DO NOTHING`;
  }
  return { sql: replaceQuestionPlaceholders(sql), ignoredBindings: false };
}
