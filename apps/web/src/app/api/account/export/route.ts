import { NextResponse } from "next/server";

import { accountCsv, exportAccount } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * Everything we hold, as a file.
 *
 * The JSON is the complete export: every table, every row, nothing filtered
 * out. The CSV is the same data flattened for a spreadsheet, which is what
 * most people actually want when they ask for their data.
 *
 * The browser's own copy — pins, progress, the due date — never reaches this
 * route, because it never reaches the server. The settings page merges the
 * two before it hands over a file.
 */
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") {
    return NextResponse.json({ error: "unknown format" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const account = await exportAccount(sql, scope);
  const day = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new NextResponse(accountCsv(account), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nine-to-three-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(JSON.stringify(account, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="nine-to-three-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
