import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { buildConfig } from "@/lib/auth/config";
import { getDb } from "@/lib/auth/db";
import { guardSignIn } from "@/lib/auth/guard";

let instance: ReturnType<typeof NextAuth> | undefined;

async function auth() {
  instance ??= NextAuth(await buildConfig());
  return instance;
}

export async function GET(request: NextRequest) {
  return (await auth()).handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { sql } = await getDb();
  const { blocked } = await guardSignIn(request, { sql });
  if (blocked) return blocked;
  return (await auth()).handlers.POST(request);
}
