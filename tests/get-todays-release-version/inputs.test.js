import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/get-todays-release-version/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("get-todays-release-version Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles version, milestoneRepository, milestoneToken from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "org/milestone-repo";
    process.env.GITHUB_TOKEN = "milestone-token";
    setupGetInput({
      "snapshot-version": "6.2.0-SNAPSHOT",
      "milestone-repository": "",
      "milestone-token": "",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.2.0-SNAPSHOT");
    expect(inputs.milestoneRepository).toBe("org/milestone-repo");
    expect(inputs.milestoneToken).toBe("milestone-token");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit milestone-repository and milestone-token over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      "snapshot-version": "6.2.0-SNAPSHOT",
      "milestone-repository": "other/other-repo",
      "milestone-token": "input-token",
    });

    const inputs = new Inputs();

    expect(inputs.milestoneRepository).toBe("other/other-repo");
    expect(inputs.milestoneToken).toBe("input-token");
  });
});
