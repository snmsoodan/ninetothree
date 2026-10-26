import { Client } from "pg";

import { purgeDeleted } from "../account";
import type { SqlClient } from "../migrate";

const USAGE = `usage: db:purge [--dry-run]

  --dry-run   say what would go, and change nothing

Reads DATABASE_URL. Removes every account whose thirty-day grace period has
run out, and any household left with no members.`;

async function main(argv: string[]): Promise<number> {
  const unknown = argv.filter((arg) => arg !== "--dry-run");
  if (unknown.length > 0) {
    process.stderr.write(`unknown argument: ${unknown[0]}\n${USAGE}\n`);
    return 1;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    process.stderr.write("DATABASE_URL is not set\n");
    return 1;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  const sql: SqlClient = {
    exec: (statement) => client.query(statement),
    query: ((statement: string, params?: unknown[]) =>
      client.query(statement, params)) as SqlClient["query"],
  };

  try {
    if (argv.includes("--dry-run")) {
      const { rows } = await client.query<{ email: string; purge_after: Date }>(
        `select u.email, d.purge_after
           from deletion_requests d
           join users u on u.id = d.user_id
          where d.cancelled_at is null and d.purge_after <= now()
          order by d.purge_after`,
      );
      if (rows.length === 0) {
        process.stdout.write("nothing is due\n");
      } else {
        process.stdout.write(
          rows.map((row) => `${row.email}  due ${row.purge_after.toISOString()}`).join("\n") + "\n",
        );
      }
      return 0;
    }

    const { purged } = await purgeDeleted(sql);
    process.stdout.write(`purged ${purged} ${purged === 1 ? "account" : "accounts"}\n`);
    return 0;
  } finally {
    await client.end();
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  },
);
