import { Client } from "pg";

import { migrateDown, migrateUp, migrationStatus, type SqlClient } from "../migrate";

const USAGE = `usage: db <up|down|status> [steps]

  up            apply every pending migration
  down [n]      roll back the last n migrations (default 1)
  status        list applied and pending migrations

Reads DATABASE_URL.`;

async function main(argv: string[]): Promise<number> {
  const [command, argument] = argv;
  const url = process.env.DATABASE_URL;
  if (!url) {
    process.stderr.write("DATABASE_URL is not set\n");
    return 1;
  }
  if (command !== "up" && command !== "down" && command !== "status") {
    process.stderr.write(`${USAGE}\n`);
    return 1;
  }
  const steps = argument === undefined ? 1 : Number(argument);
  if (command === "down" && (!Number.isInteger(steps) || steps < 1)) {
    process.stderr.write(`steps must be a positive integer\n${USAGE}\n`);
    return 1;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  // `pg` constrains its row type to `QueryResultRow`; the runner only ever
  // asks for `{ name: string }`, which satisfies it, so the cast is safe.
  const sql: SqlClient = {
    exec: (statement) => client.query(statement),
    query: ((statement: string, params?: unknown[]) =>
      client.query(statement, params)) as SqlClient["query"],
  };

  try {
    if (command === "up") {
      const ran = await migrateUp(sql);
      process.stdout.write(ran.length === 0 ? "nothing to apply\n" : `applied ${ran.join(", ")}\n`);
      return 0;
    }
    if (command === "down") {
      const rolled = await migrateDown(sql, undefined, steps);
      process.stdout.write(`rolled back ${rolled.join(", ")}\n`);
      return 0;
    }
    const { applied, pending } = await migrationStatus(sql);
    process.stdout.write(
      `applied: ${applied.length === 0 ? "none" : applied.join(", ")}\n` +
        `pending: ${pending.length === 0 ? "none" : pending.join(", ")}\n`,
    );
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
