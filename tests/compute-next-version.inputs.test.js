import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../src/compute-next-version/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-next-version Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles version, token, repository, projectSlug from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-framework";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "6.2.0",
      token: "",
      repository: "",
      "project-slug": "",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.2.0");
    expect(inputs.token).toBe("env-token");
    expect(inputs.repository).toBe("spring-projects/spring-framework");
    expect(inputs.projectSlug).toBe("spring-framework");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit repository and token over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "6.2.0",
      token: "input-token",
      repository: "custom/override-repo",
      "project-slug": "override-slug",
    });

    const inputs = new Inputs();

    expect(inputs.token).toBe("input-token");
    expect(inputs.repository).toBe("custom/override-repo");
    expect(inputs.projectSlug).toBe("override-slug");
  });

  it("strips -commercial from repository name for projectSlug when not overridden", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot-commercial";
    process.env.GITHUB_TOKEN = "token";
    setupGetInput({
      version: "3.0.0",
      token: "",
      repository: "",
      "project-slug": "",
    });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-boot");
  });
});
