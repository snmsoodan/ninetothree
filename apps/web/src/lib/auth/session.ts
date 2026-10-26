import NextAuth from "next-auth";

import { buildConfig } from "./config";

let instance: ReturnType<typeof NextAuth> | undefined;

async function get() {
  instance ??= NextAuth(await buildConfig());
  return instance;
}

/**
 * Who is signed in, or null.
 *
 * The Auth.js instance is built once per process: route handlers and server
 * components both ask this question, and building the config twice would mean
 * two adapters and two provider lists against the same database.
 */
export async function auth() {
  return (await get()).auth();
}

/** The request handlers, for the catch-all route. */
export async function handlers() {
  return (await get()).handlers;
}
