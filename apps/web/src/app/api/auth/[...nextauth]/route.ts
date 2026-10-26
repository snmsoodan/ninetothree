import type { NextRequest } from "next/server";

import { getDb } from "@/lib/auth/db";
import { guardSignIn } from "@/lib/auth/guard";
import { handlers } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  return (await handlers()).GET(request);
}

export async function POST(request: NextRequest) {
  const { sql } = await getDb();
  const { blocked } = await guardSignIn(request, { sql });
  if (blocked) return blocked;
  return (await handlers()).POST(request);
}
