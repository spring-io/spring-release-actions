import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/compute-next-scheduled-milestone/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-next-scheduled-milestone Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
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
