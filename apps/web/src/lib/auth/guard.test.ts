import { describe, expect, it, vi } from "vitest";

import { guardSignIn } from "./guard";

const T0 = new Date("2026-03-01T12:00:00Z");

function fakeSql(count: number, oldest: Date | null = null) {
  return {
    exec: vi.fn(),
    query: vi.fn(async (statement: string) => {
      if (statement.includes("count(*)")) return { rows: [{ n: String(count), oldest }] };
      return { rows: [] };
    }),
  } as unknown as Parameters<typeof guardSignIn>[1]["sql"];
}

function formPost(path: string, email?: string) {
  const body = new URLSearchParams();
  if (email) body.set("email", email);
  return new Request(`https://ninetothree.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

describe("guardSignIn", () => {
  it("lets a first request through and records it", async () => {
    const sql = fakeSql(0);

    const result = await guardSignIn(formPost("/api/auth/signin/email", "maya@example.com"), {
      sql,
      now: T0,
    });

    expect(result.blocked).toBeNull();
    expect(result.email).toBe("maya@example.com");
    const insert = (sql.query as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[0]).includes("insert into auth_attempts"),
    );
    expect(insert).toBeDefined();
  });

  it("refuses the sixth request with a 429 and a Retry-After", async () => {
    const sql = fakeSql(5, new Date(T0.getTime() - 60_000));

    const result = await guardSignIn(formPost("/api/auth/signin/email", "maya@example.com"), {
      sql,
      now: T0,
    });

    expect(result.blocked?.status).toBe(429);
    expect(result.blocked?.headers.get("Retry-After")).toBe("840");
    const body = await result.blocked!.json();
    expect(body.error).toBe("too-many-requests");
    expect(body.message).not.toMatch(/oops|error code/i);
  });

  it("does not record a request it refused", async () => {
    const sql = fakeSql(5, new Date(T0.getTime() - 60_000));

    await guardSignIn(formPost("/api/auth/signin/email", "maya@example.com"), { sql, now: T0 });

    const insert = (sql.query as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[0]).includes("insert into auth_attempts"),
    );
    expect(insert).toBeUndefined();
  });

  it("lowercases the address so two spellings share one count", async () => {
    const sql = fakeSql(0);

    const result = await guardSignIn(formPost("/api/auth/signin/email", "  Maya@Example.COM "), {
      sql,
      now: T0,
    });

    expect(result.email).toBe("maya@example.com");
  });

  it("reads a JSON body too", async () => {
    const sql = fakeSql(0);
    const request = new Request("https://ninetothree.com/api/auth/signin/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "maya@example.com" }),
    });

    const result = await guardSignIn(request, { sql, now: T0 });

    expect(result.email).toBe("maya@example.com");
  });

  it("ignores a JSON body with no address", async () => {
    const sql = fakeSql(0);
    const request = new Request("https://ninetothree.com/api/auth/signin/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: 42 }),
    });

    const result = await guardSignIn(request, { sql, now: T0 });

    expect(result).toEqual({ blocked: null, email: null });
  });

  it("ignores a form with no address", async () => {
    const sql = fakeSql(0);

    const result = await guardSignIn(formPost("/api/auth/signin/email"), { sql, now: T0 });

    expect(result).toEqual({ blocked: null, email: null });
  });

  it("ignores a body it cannot parse", async () => {
    const sql = fakeSql(0);
    const request = new Request("https://ninetothree.com/api/auth/signin/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });

    const result = await guardSignIn(request, { sql, now: T0 });

    expect(result).toEqual({ blocked: null, email: null });
  });

  it("ignores a post with no content type at all", async () => {
    const sql = fakeSql(0);
    const request = new Request("https://ninetothree.com/api/auth/signin/email", {
      method: "POST",
    });

    const result = await guardSignIn(request, { sql, now: T0 });

    expect(result).toEqual({ blocked: null, email: null });
  });

  it("ignores a GET, because only a POST sends mail", async () => {
    const sql = fakeSql(0);
    const request = new Request("https://ninetothree.com/api/auth/signin/email");

    const result = await guardSignIn(request, { sql, now: T0 });

    expect(result).toEqual({ blocked: null, email: null });
    expect(sql.query).not.toHaveBeenCalled();
  });

  it("ignores every other auth route", async () => {
    const sql = fakeSql(0);

    const result = await guardSignIn(formPost("/api/auth/callback/email", "maya@example.com"), {
      sql,
      now: T0,
    });

    expect(result).toEqual({ blocked: null, email: null });
    expect(sql.query).not.toHaveBeenCalled();
  });

  it("guards the nodemailer alias as well as email", async () => {
    const sql = fakeSql(0);

    const result = await guardSignIn(formPost("/api/auth/signin/nodemailer", "maya@example.com"), {
      sql,
      now: T0,
    });

    expect(result.email).toBe("maya@example.com");
  });
});
