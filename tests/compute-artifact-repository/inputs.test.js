import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/compute-artifact-repository/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-artifact-repository Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("settles version and repository from inputs and freezes", () => {
    setupGetInput({ version: "6.5.8", repository: "my-org/my-repo" });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.5.8");
    expect(inputs.repository).toBe("my-org/my-repo");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("falls back to GITHUB_REPOSITORY when repository input is not provided", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({ version: "6.5.8", repository: "" });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security");
  });

  it("prefers explicit repository input over GITHUB_REPOSITORY", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({ version: "6.5.8", repository: "my-org/my-repo" });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("my-org/my-repo");
  });
});
