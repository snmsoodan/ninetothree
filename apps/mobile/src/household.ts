import {
  CreateJobRequest,
  Together,
  UpdateJobRequest,
  type JobStatus,
  type Together as TogetherPayload,
} from "@ninetothree/contracts";

/**
 * The household, over the wire.
 *
 * Same routes the browser calls, with a bearer token instead of a cookie, and
 * the same contract parsing the routes do on the way out. The fetch and the
 * token are ports so the tests can hold both, and so the device that has not
 * signed in yet (#158) simply supplies no token: the phone then makes no
 * request at all rather than one it knows will be refused.
 */

export interface HouseholdResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type HouseholdFetch = (url: string, init: RequestInit) => Promise<HouseholdResponse>;

export interface HouseholdPorts {
  fetch: HouseholdFetch;
  /** The origin the web app is served from. No trailing slash. */
  baseUrl: string;
  /** The bearer token from `/api/auth/native/exchange`, or null when signed out. */
  token: string | null;
}

/** Four outcomes, because "failed" and "signed out" need different words. */
export type HouseholdRead =
  { state: "ready"; data: TogetherPayload } | { state: "signed-out" } | { state: "failed" };

export interface HouseholdClient {
  together: (stageId?: string | null) => Promise<HouseholdRead>;
  assignJob: (input: CreateJobRequest) => Promise<boolean>;
  setJobStatus: (id: string, status: JobStatus) => Promise<boolean>;
  removeJob: (id: string) => Promise<boolean>;
}

function join(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

export function createHousehold({ fetch, baseUrl, token }: HouseholdPorts): HouseholdClient {
  async function send(
    path: string,
    init: Omit<RequestInit, "headers"> = {},
  ): Promise<HouseholdResponse | null> {
    if (!token) return null;
    return fetch(join(baseUrl, path), {
      ...init,
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
  }

  return {
    async together(stageId) {
      const query = stageId ? `?stage=${encodeURIComponent(stageId)}` : "";
      const response = await send(`/api/household/together${query}`);
      if (!response) return token ? { state: "failed" } : { state: "signed-out" };
      if (response.status === 401) return { state: "signed-out" };
      if (!response.ok) return { state: "failed" };

      // The route parsed this with the same schema. Parsing again is what stops
      // a stale server from drawing half a page with undefined names in it.
      const parsed = Together.safeParse(await response.json().catch(() => null));
      return parsed.success ? { state: "ready", data: parsed.data } : { state: "failed" };
    },

    async assignJob(input) {
      const body = CreateJobRequest.safeParse(input);
      if (!body.success) return false;
      const response = await send("/api/household/jobs", {
        method: "POST",
        body: JSON.stringify(body.data),
      });
      return Boolean(response?.ok);
    },

    async setJobStatus(id, status) {
      const body = UpdateJobRequest.safeParse({ status });
      if (!body.success) return false;
      const response = await send(`/api/household/jobs/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body.data),
      });
      return Boolean(response?.ok);
    },

    async removeJob(id) {
      const response = await send(`/api/household/jobs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return Boolean(response?.ok);
    },
  };
}
