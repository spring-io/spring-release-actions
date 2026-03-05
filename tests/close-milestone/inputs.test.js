import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/close-milestone/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("close-milestone Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
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
