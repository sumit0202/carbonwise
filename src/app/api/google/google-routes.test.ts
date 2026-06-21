import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetSharedState } from "@/lib/google/handler";
import { GET as geocodeGET } from "@/app/api/google/geocode/route";
import { POST as routesPOST } from "@/app/api/google/routes/route";
import { GET as placesGET } from "@/app/api/google/places/route";
import { GET as airGET } from "@/app/api/google/air-quality/route";
import { GET as solarGET } from "@/app/api/google/solar/route";
import { GET as pollenGET } from "@/app/api/google/pollen/route";
import { GET as tzGET } from "@/app/api/google/timezone/route";

beforeEach(() => {
  _resetSharedState();
  vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
});

function get(url: string): Request {
  return new Request(url, { headers: { "x-forwarded-for": "1.2.3.4" } });
}

describe("geocode route", () => {
  it("returns demo data for a valid address", async () => {
    const res = await geocodeGET(get("https://app.test/?address=Seattle"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demo).toBe(true);
  });

  it("rejects a short address", async () => {
    const res = await geocodeGET(get("https://app.test/?address=a"));
    expect(res.status).toBe(400);
  });

  it("rejects a missing address", async () => {
    const res = await geocodeGET(get("https://app.test/"));
    expect(res.status).toBe(400);
  });
});

describe("routes route", () => {
  function post(body: unknown): Request {
    return new Request("https://app.test/", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns demo options for a valid body", async () => {
    const res = await routesPOST(
      post({ origin: { lat: 1, lng: 2 }, destination: { lat: 3, lng: 4 } }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects an invalid body", async () => {
    const res = await routesPOST(post({ origin: { lat: 1 } }));
    expect(res.status).toBe(400);
  });

  it("rejects non-JSON bodies", async () => {
    const req = new Request("https://app.test/", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: "not json",
    });
    const res = await routesPOST(req);
    expect(res.status).toBe(400);
  });
});

describe("places route", () => {
  it("returns demo places for valid params", async () => {
    const res = await placesGET(
      get("https://app.test/?lat=47.6&lng=-122.3&category=recycling"),
    );
    expect(res.status).toBe(200);
  });

  it("rejects an invalid category", async () => {
    const res = await placesGET(
      get("https://app.test/?lat=47.6&lng=-122.3&category=bogus"),
    );
    expect(res.status).toBe(400);
  });
});

describe.each([
  ["air-quality", airGET],
  ["solar", solarGET],
  ["pollen", pollenGET],
  ["timezone", tzGET],
])("%s route", (_name, handler) => {
  it("returns demo data for a valid point", async () => {
    const res = await handler(get("https://app.test/?lat=47.6&lng=-122.3"));
    expect(res.status).toBe(200);
    expect((await res.json()).demo).toBe(true);
  });

  it("rejects an invalid point", async () => {
    const res = await handler(get("https://app.test/?lat=999&lng=0"));
    expect(res.status).toBe(400);
  });
});

describe("rate limiting", () => {
  it("returns 429 once the per-IP bucket is empty", async () => {
    let status = 200;
    for (let i = 0; i < 40; i += 1) {
      const res = await tzGET(get("https://app.test/?lat=47.6&lng=-122.3"));
      status = res.status;
      if (status === 429) break;
    }
    expect(status).toBe(429);
  });
});
