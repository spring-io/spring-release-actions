import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/plan-on-gchat/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("plan-on-gchat Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("settles gchatWebhookUrl, version, versionDate, projectName from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      "gchat-webhook-url": "https://webhook.example.com",
      version: "7.0.0",
      "version-date": "2025-03-01",
      "project-name": "",
    });

    const inputs = new Inputs();

    expect(inputs.gchatWebhookUrl).toBe("https://webhook.example.com");
    expect(inputs.version).toBe("7.0.0");
    expect(inputs.versionDate).toBe("2025-03-01");
    expect(inputs.projectName).toBe("spring-security");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit project-name over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    setupGetInput({
      "gchat-webhook-url": "",
      version: "",
      "version-date": "",
      "project-name": "my-project",
    });

    const inputs = new Inputs();

    expect(inputs.projectName).toBe("my-project");
  });
});
