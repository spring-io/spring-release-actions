import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as core from "../__fixtures__/core.js";
import { run } from "../src/compute-next-version/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const PROJECTS_API = "https://test.spring.io";

const milestones = [
  { number: 1, title: "1.0.0", state: "open", due_on: "2025-05-21T00:00:00Z" },
];

const server = setupServer(
  http.get("https://api.github.com/repos/owner/repo/milestones", ({ request }) => {
    const state = new URL(request.url).searchParams.get("state") || "open";
    const result = state === "all" ? milestones : milestones.filter((m) => m.state === state);
    return HttpResponse.json(result);
  }),
  http.get(`${PROJECTS_API}/projects/spring-boot/generations`, () => {
    return HttpResponse.json({
      _embedded: {
        generations: [
          { name: "1.0", ossSupportEndDate: "2028-01", commercialSupportEndDate: "2031-01" },
        ],
      },
    });
  }),
);

describe("compute-next-version integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  it("computes and outputs the next version from a milestone and generation", async () => {
    await run({
      version: "1.0.0",
      token: "test-token",
      repository: "owner/repo",
      projectSlug: "spring-boot",
      projectsApiBase: PROJECTS_API,
    });

    expect(core.setOutput).toHaveBeenCalledWith("version", expect.any(String));
    expect(core.setOutput).toHaveBeenCalledWith("version-date", expect.any(String));
    expect(core.setOutput).toHaveBeenCalledWith("version-type", expect.any(String));
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("reads generations from the filesystem when projectsApiBase is a path", async () => {
    const dir = await mkdir(join(tmpdir(), "spring-test"), { recursive: true });
    const apiBase = join(tmpdir(), "spring-test");
    await mkdir(join(apiBase, "projects", "spring-boot"), { recursive: true });
    await writeFile(
      join(apiBase, "projects", "spring-boot", "generations.json"),
      JSON.stringify({
        generations: [
          { name: "1.0", ossSupportEndDate: "2028-01", commercialSupportEndDate: "2031-01" },
        ],
      }),
    );

    try {
      await run({
        version: "1.0.0",
        token: "test-token",
        repository: "owner/repo",
        projectSlug: "spring-boot",
        projectsApiBase: apiBase,
      });

      expect(core.setOutput).toHaveBeenCalledWith("version", expect.any(String));
      expect(core.setOutput).toHaveBeenCalledWith("version-date", expect.any(String));
      expect(core.setOutput).toHaveBeenCalledWith("version-type", expect.any(String));
      expect(core.setFailed).not.toHaveBeenCalled();
    } finally {
      await rm(apiBase, { recursive: true });
    }
  });
});
