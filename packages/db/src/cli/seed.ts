import { Client } from "pg";

import type { SqlClient } from "../migrate";
import { assertSafeToSeed, seed } from "../seed";

const USAGE = `usage: db:seed [--force] [--no-packs]

  --force      seed a database that is not on localhost
  --no-packs   skip the 85 shipped stage packs

Reads DATABASE_URL. Deletes the personal tables first.`;

async function main(argv: string[]): Promise<number> {
  const unknown = argv.filter((arg) => arg !== "--force" && arg !== "--no-packs");
  if (unknown.length > 0) {
    process.stderr.write(`unknown argument: ${unknown[0]}\n${USAGE}\n`);
    return 1;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    process.stderr.write("DATABASE_URL is not set\n");
    return 1;
  }
  try {
    assertSafeToSeed(url, argv.includes("--force"));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
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
    const report = await seed(sql, { packs: !argv.includes("--no-packs") });
    process.stdout.write(
      [
        `seeded ${report.households} households, ${report.users} users`,
        `  ${report.pregnancies} pregnancies, ${report.children} children`,
        `  ${report.itemStates} item states, ${report.progress} progress rows`,
        `  ${report.appointments} appointments, ${report.reminders} reminders`,
        `  ${report.subscriptions} subscriptions, ${report.packs} stage packs`,
        "",
        "sign in as maya@example.com (28 weeks), priya@example.com (6 weeks)",
        "or ingrid@example.com (4 months postpartum)",
      ].join("\n") + "\n",
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
