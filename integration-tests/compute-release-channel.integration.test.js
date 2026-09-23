import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as core from "../__fixtures__/core.js";
import { run } from "../src/compute-release-channel/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const PROJECTS_API = "https://test.spring.io";

const server = setupServer(
  http.get(`${PROJECTS_API}/projects/spring-security/generations`, () => {
    return HttpResponse.json({
      _embedded: {
        generations: [
          {
            name: "5.7",
            ossSupportEndDate: "2020-06",
            commercialSupportEndDate: "2031-01",
          },
          {
            name: "7.1",
            ossSupportEndDate: "2028-01",
            commercialSupportEndDate: "2031-01",
          },
        ],
      },
    });
  }),
);

describe("compute-release-channel integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => {
    server.resetHandlers();
    core.setOutput.mockReset();
    core.setFailed.mockReset();
  });

  it("resolves lts for a commercial-phase version in a private repository", async () => {
    await run({
      version: "5.7.29",
      private: true,
      repository: "spring-projects/spring-security-commercial",
      projectSlug: "spring-security",
      projectsApiBase: PROJECTS_API,
    });

    expect(core.setOutput).toHaveBeenCalledWith("channel", "lts");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("resolves oss for an oss-phase version in a public repository", async () => {
    await run({
      version: "7.1.3",
      private: false,
      repository: "spring-projects/spring-security",
      projectSlug: "spring-security",
      projectsApiBase: PROJECTS_API,
    });

    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
    expect(core.setFailed).not.toHaveBeenCalled();
  });
});
