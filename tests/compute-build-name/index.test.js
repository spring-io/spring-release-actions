import { vi } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { run } from "../../src/compute-build-name/index.js";

vi.mock(
  "@actions/core",
  async () => await import("../../__fixtures__/core.js"),
);

// gh-99
describe("compute-build-name", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses branch version for a snapshot", async () => {
    await run({
      repository: "spring-projects/spring-security",
      version: "6.5.0-SNAPSHOT",
    });

    expect(core.setOutput).toHaveBeenCalledWith(
      "build-name",
      "spring-security-6.5.x",
    );
  });

  it("uses release version for a GA version", async () => {
    await run({
      repository: "spring-projects/spring-security",
      version: "6.5.0",
    });

    expect(core.setOutput).toHaveBeenCalledWith(
      "build-name",
      "spring-security-6.5.0",
    );
  });

  it("uses release version for a milestone", async () => {
    await run({
      repository: "spring-projects/spring-security",
      version: "6.5.0-M1",
    });

    expect(core.setOutput).toHaveBeenCalledWith(
      "build-name",
      "spring-security-6.5.0-M1",
    );
  });

  it("uses release version for a release candidate", async () => {
    await run({
      repository: "spring-projects/spring-security",
      version: "6.5.0-RC1",
    });

    expect(core.setOutput).toHaveBeenCalledWith(
      "build-name",
      "spring-security-6.5.0-RC1",
    );
  });

  it("derives branch version from a different project", async () => {
    await run({
      repository: "spring-projects/spring-integration",
      version: "3.4.1-SNAPSHOT",
    });

    expect(core.setOutput).toHaveBeenCalledWith(
      "build-name",
      "spring-integration-3.4.x",
    );
  });
});
