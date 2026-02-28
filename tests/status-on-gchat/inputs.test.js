import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/status-on-gchat/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("status-on-gchat Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles gchatWebhookUrl and token from inputs and env", () => {
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      "gchat-webhook-url": "https://webhook.example.com",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.gchatWebhookUrl).toBe("https://webhook.example.com");
    expect(inputs.token).toBe("env-token");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit token over GITHUB_TOKEN", () => {
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      "gchat-webhook-url": "",
      token: "input-token",
    });

    const inputs = new Inputs();

    expect(inputs.token).toBe("input-token");
  });
});
