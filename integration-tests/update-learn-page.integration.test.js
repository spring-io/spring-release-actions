import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../src/update-learn-page/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const contents = new Map();

const server = setupServer(
  http.get(
    "https://api.github.com/repos/spring-io/spring-website-content/contents/:path*",
    ({ params }) => {
      const filePath = params.path instanceof Array ? params.path.join("/") : params.path;
      const stored = contents.get(filePath);
      if (!stored) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({ content: stored.content, sha: stored.sha, encoding: "base64" });
    },
  ),
  http.put(
    "https://api.github.com/repos/spring-io/spring-website-content/contents/:path*",
    async ({ params, request }) => {
      const filePath = params.path instanceof Array ? params.path.join("/") : params.path;
      const body = await request.json();
      const sha = body.sha || `sha-${Date.now()}`;
      contents.set(filePath, { content: body.content, sha });
      return HttpResponse.json({ content: { path: filePath, sha } });
    },
  ),
);

const baseInputs = {
  websiteToken: "test-token",
  websiteRepository: "spring-io/spring-website-content",
  projectName: "owner/spring-boot",
  projectSlug: "spring-boot",
  isAntora: true,
  commercial: false,
  refDocUrl: "https://docs.spring.io/{project}/reference/{version}/index.html",
  apiDocUrl: "https://docs.spring.io/{project}/site/docs/{version}/api/",
  resolvedRefDocUrl: "https://docs.spring.io/spring-boot/reference/{version}/index.html",
  resolvedApiDocUrl: "https://docs.spring.io/spring-boot/site/docs/{version}/api/",
};

describe("update-learn-page (github strategy) integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  beforeEach(() => contents.clear());
  afterEach(() => server.resetHandlers());

  it("creates a documentation file and then replaces same-generation entries on update", async () => {
    await run({ ...baseInputs, version: "1.2.3" });
    await run({ ...baseInputs, version: "1.2.4" });

    const stored = contents.get("project/spring-boot/documentation.json");
    const entries = JSON.parse(Buffer.from(stored.content, "base64").toString());

    expect(entries.some((e) => e.version === "1.2.4")).toBe(true);
    expect(entries.some((e) => e.version === "1.2.5-SNAPSHOT")).toBe(true);
    expect(entries.some((e) => e.version === "1.2.3")).toBe(false);
  });
});
