import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as core from "../__fixtures__/core.js";
import { run } from "../src/check-maven-artifact/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const REPO_URL = "http://test.maven/repo";

const server = setupServer(
  http.head(`${REPO_URL}/org/springframework/spring-core/6.1.0/`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
  http.head(`${REPO_URL}/org/springframework/spring-core/9.9.9/`, () => {
    return new HttpResponse(null, { status: 404 });
  }),
);

describe("check-maven-artifact integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  it("succeeds and sets found=true when artifact exists", async () => {
    await run({ repositoryUrl: REPO_URL, artifactPath: "org/springframework/spring-core", version: "6.1.0", timeout: 0 });

    expect(core.setOutput).toHaveBeenCalledWith("found", true);
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("sets found=false and calls setFailed when artifact is not found", async () => {
    await run({ repositoryUrl: REPO_URL, artifactPath: "org/springframework/spring-core", version: "9.9.9", timeout: 0 });

    expect(core.setOutput).toHaveBeenCalledWith("found", false);
    expect(core.setFailed).toHaveBeenCalled();
  });
});
