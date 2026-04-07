import { vi } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { Inputs } from "../../src/compute-build-name/inputs.js";

vi.mock(
  "@actions/core",
  async () => await import("../../__fixtures__/core.js"),
);

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

// gh-99
describe("compute-build-name Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("settles all fields from inputs and freezes", () => {
    setupGetInput({
      repository: "spring-projects/spring-security",
      version: "6.5.0-SNAPSHOT",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security");
    expect(inputs.version).toBe("6.5.0-SNAPSHOT");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("falls back to environment variables when inputs are not provided", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      repository: "",
      version: "6.5.0-SNAPSHOT",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security");
  });

  it("prefers explicit inputs over environment variables", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      repository: "my-org/my-repo",
      version: "6.5.0",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("my-org/my-repo");
  });
});
