import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../src/schedule-milestone/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("schedule-milestone Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles version, versionDate, description, repository, token from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "3.3.0",
      "version-date": "2025-04-01",
      description: "Release 3.3.0",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("3.3.0");
    expect(inputs.versionDate).toBe("2025-04-01");
    expect(inputs.description).toBe("Release 3.3.0");
    expect(inputs.repository).toBe("spring-projects/spring-boot");
    expect(inputs.token).toBe("env-token");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit repository and token over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      repository: "custom/repo",
      token: "input-token",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("custom/repo");
    expect(inputs.token).toBe("input-token");
  });
});
