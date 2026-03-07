import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../src/update-learn-page/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const API_BASE = "https://test.spring.io";

let releases = [];

const server = setupServer(
  http.get(`${API_BASE}/projects/:slug/releases`, () => {
    return HttpResponse.json({ _embedded: { releases: [...releases] } });
  }),
  http.delete(`${API_BASE}/projects/:slug/releases/:version`, ({ params }) => {
    const version = decodeURIComponent(params.version);
    releases = releases.filter((r) => r.version !== version);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${API_BASE}/projects/:slug/releases`, async ({ request }) => {
    releases.push(await request.json());
    return new HttpResponse(null, { status: 201 });
  }),
);

const baseInputs = {
  projectName: "owner/spring-boot",
  projectSlug: "spring-boot",
  isAntora: true,
  commercial: false,
  token: "test-token",
  projectsApiBase: API_BASE,
  resolvedRefDocUrl: "https://docs.spring.io/spring-boot/reference/{version}/index.html",
  resolvedApiDocUrl: "https://docs.spring.io/spring-boot/site/docs/{version}/api/",
};

describe("update-learn-page (API strategy) integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  beforeEach(() => { releases = []; });
  afterEach(() => server.resetHandlers());

  it("creates releases and then replaces same-generation entries on update", async () => {
    await run({ ...baseInputs, version: "1.2.3" });
    await run({ ...baseInputs, version: "1.2.4" });

    // After step 2 (version 1.2.4), same-generation entries (1.2.3, 1.2.4-SNAPSHOT)
    // are deleted and replaced with 1.2.4 and 1.2.5-SNAPSHOT
    expect(releases.some((r) => r.version === "1.2.4")).toBe(true);
    expect(releases.some((r) => r.version === "1.2.5-SNAPSHOT")).toBe(true);
    expect(releases.some((r) => r.version === "1.2.3")).toBe(false);
  });
});
