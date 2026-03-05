import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/compute-next-snapshot/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-next-snapshot Inputs constructor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("settles version and freezes", () => {
    setupGetInput({ version: "6.2.0" });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.2.0");
    expect(Object.isFrozen(inputs)).toBe(true);
  });
});
