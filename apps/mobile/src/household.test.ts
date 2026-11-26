import { describe, expect, it, vi } from "vitest";

import { createHousehold, type HouseholdFetch, type HouseholdResponse } from "./household";

/**
 * The household client, against a fake fetch.
 *
 * Three things are worth pinning here and nothing else is: that a signed-out
 * device makes no request at all, that every request carries the bearer token
 * the routes already accept, and that a body which does not parse is a failure
 * rather than half a page. The real routes are exercised by the web suite.
 */

function response(status: number, body: unknown): HouseholdResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

function spy(answer: HouseholdResponse | Error) {
  return vi.fn<HouseholdFetch>((_url, _init) =>
    answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer),
  );
}

const HOUSEHOLD = {
  id: "h1",
  role: "partner",
  members: [{ userId: "u1", role: "partner", email: "a@b.co", name: "Sam", isYou: true }],
  shared: [],
  jobs: [],
  appointments: [],
  week: null,
};

const BASE = "https://ninetothree.com";

describe("createHousehold", () => {
  it("makes no request at all when the device has no token", async () => {
    const fetch = spy(response(200, HOUSEHOLD));
    const client = createHousehold({ fetch, baseUrl: BASE, token: null });

    expect(await client.together()).toEqual({ state: "signed-out" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the stage and the bearer token, and reads a household", async () => {
    const fetch = spy(response(200, HOUSEHOLD));
    const client = createHousehold({ fetch, baseUrl: `${BASE}/`, token: "t0ken" });

    expect(await client.together("week-20")).toEqual({ state: "ready", data: HOUSEHOLD });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/api/household/together?stage=week-20`);
    expect(init.headers).toEqual({ authorization: "Bearer t0ken" });
  });

  it("treats a 401 as signed out, not as a failure", async () => {
    const client = createHousehold({
      fetch: spy(response(401, { error: "unauthorised" })),
      baseUrl: BASE,
      token: "stale",
    });

    expect(await client.together()).toEqual({ state: "signed-out" });
  });

  it("fails rather than drawing a payload the contract refuses", async () => {
    const client = createHousehold({
      fetch: spy(response(200, { ...HOUSEHOLD, members: [{ userId: "u1" }] })),
      baseUrl: BASE,
      token: "t0ken",
    });

    expect(await client.together()).toEqual({ state: "failed" });
  });

  it("fails on a body that is not JSON, and on a dropped connection", async () => {
    const notJson: HouseholdResponse = {
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("not json")),
    };
    const broken = createHousehold({ fetch: spy(notJson), baseUrl: BASE, token: "t0ken" });
    const offline = createHousehold({
      fetch: spy(new Error("offline")),
      baseUrl: BASE,
      token: "t0ken",
    });

    expect(await broken.together()).toEqual({ state: "failed" });
    expect(await offline.together()).toEqual({ state: "failed" });
  });

  it("hands a job over as JSON with a content type, and nothing when it is blank", async () => {
    const fetch = spy(response(201, { job: { id: "j1" } }));
    const client = createHousehold({ fetch, baseUrl: BASE, token: "t0ken" });

    expect(
      await client.assignJob({
        itemId: "car-seat",
        title: "Buy the car seat",
        assignedTo: "u2",
        packId: null,
        packTitle: null,
      }),
    ).toBe(true);

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/api/household/jobs`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "content-type": "application/json",
      authorization: "Bearer t0ken",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      itemId: "car-seat",
      title: "Buy the car seat",
      assignedTo: "u2",
      packId: null,
      packTitle: null,
    });

    // A blank assignee is refused before the wire, so a job never lands on nobody.
    fetch.mockClear();
    expect(await client.assignJob({ itemId: "x", title: "Do a thing", assignedTo: "" })).toBe(
      false,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("moves a job with PATCH and clears it with DELETE, both on the encoded id", async () => {
    const fetch = spy(response(200, {}));
    const client = createHousehold({ fetch, baseUrl: BASE, token: "t0ken" });

    expect(await client.setJobStatus("a/b", "done")).toBe(true);
    expect(await client.removeJob("a/b")).toBe(true);

    expect(fetch.mock.calls[0]![0]).toBe(`${BASE}/api/household/jobs/a%2Fb`);
    expect(fetch.mock.calls[0]![1].method).toBe("PATCH");
    expect(JSON.parse(String(fetch.mock.calls[0]![1].body))).toEqual({ status: "done" });
    expect(fetch.mock.calls[1]![1].method).toBe("DELETE");
    expect(fetch.mock.calls[1]![1].headers).toEqual({ authorization: "Bearer t0ken" });
  });

  it("reports a refused write as false rather than throwing", async () => {
    const client = createHousehold({
      fetch: spy(response(500, { error: "nope" })),
      baseUrl: BASE,
      token: "t0ken",
    });

    expect(await client.setJobStatus("j1", "done")).toBe(false);
    expect(await client.removeJob("j1")).toBe(false);
  });
});
