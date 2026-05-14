import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { run } from '../../src/compute-next-snapshot/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe("compute-next-snapshot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("outputs the next snapshot version for a GA release", async () => {
    await run({ version: "6.5.8" });

    expect(core.setOutput).toHaveBeenCalledWith("version", "6.5.9-SNAPSHOT");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("outputs the next snapshot version for a release candidate", async () => {
    await run({ version: "6.5.0-RC1" });

    expect(core.setOutput).toHaveBeenCalledWith("version", "6.5.0-SNAPSHOT");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("outputs the next snapshot version for a milestone", async () => {
    await run({ version: "6.5.0-M1" });

    expect(core.setOutput).toHaveBeenCalledWith("version", "6.5.0-SNAPSHOT");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("outputs the next snapshot version for a four-digit GA release", async () => {
    await run({ version: "6.5.0.1" });

    expect(core.setOutput).toHaveBeenCalledWith("version", "6.5.0.2-SNAPSHOT");
    expect(core.setFailed).not.toHaveBeenCalled();
  });
});
