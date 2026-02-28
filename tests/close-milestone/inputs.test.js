import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/close-milestone/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("close-milestone Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles version, token, repository from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-framework";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "6.2.0",
      token: "",
      repository: "",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.2.0");
    expect(inputs.token).toBe("env-token");
    expect(inputs.repository).toBe("spring-projects/spring-framework");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit token and repository over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "6.2.0",
      token: "input-token",
      repository: "other/repo",
    });

    const inputs = new Inputs();

    expect(inputs.token).toBe("input-token");
    expect(inputs.repository).toBe("other/repo");
  });
});
