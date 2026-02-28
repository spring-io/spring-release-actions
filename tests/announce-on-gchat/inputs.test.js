import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/announce-on-gchat/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("announce-on-gchat Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles gchatWebhookUrl, version, projectName from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    setupGetInput({
      "gchat-webhook-url": "https://webhook.example.com",
      version: "3.2.0",
      "project-name": "",
    });

    const inputs = new Inputs();

    expect(inputs.gchatWebhookUrl).toBe("https://webhook.example.com");
    expect(inputs.version).toBe("3.2.0");
    expect(inputs.projectName).toBe("spring-boot");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit project-name over GITHUB_REPOSITORY repo name", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    setupGetInput({
      "gchat-webhook-url": "",
      version: "",
      "project-name": "my-project",
    });

    const inputs = new Inputs();

    expect(inputs.projectName).toBe("my-project");
  });
});
