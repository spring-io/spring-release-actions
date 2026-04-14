import { vi } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { Inputs } from "../../src/compute-support-window/inputs.js";

vi.mock(
  "@actions/core",
  async () => await import("../../__fixtures__/core.js"),
);

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-support-window Inputs constructor", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GITHUB_REF_NAME;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("accepts a version", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({ version: "6.4.16-SNAPSHOT" });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.4.16-SNAPSHOT");
    expect(inputs.refName).toBe("");
    expect(inputs.repository).toBe("spring-projects/spring-security");
    expect(inputs.projectSlug).toBe("spring-security");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("accepts a ref-name", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({ "ref-name": "6.4.x" });

    const inputs = new Inputs();

    expect(inputs.version).toBe("");
    expect(inputs.refName).toBe("6.4.x");
  });

  it("strips -commercial from repository name for projectSlug", () => {
    process.env.GITHUB_REPOSITORY =
      "spring-projects/spring-security-commercial";
    setupGetInput({ "ref-name": "6.4.x" });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-security");
  });

  it("falls back to GITHUB_REF_NAME when ref-name input is empty", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    process.env.GITHUB_REF_NAME = "6.4.x";
    setupGetInput({});

    const inputs = new Inputs();

    expect(inputs.refName).toBe("6.4.x");
  });

  it("prefers an explicit ref-name input over GITHUB_REF_NAME", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    process.env.GITHUB_REF_NAME = "main";
    setupGetInput({ "ref-name": "6.4.x" });

    const inputs = new Inputs();

    expect(inputs.refName).toBe("6.4.x");
  });

  it("requires either version, ref-name, or GITHUB_REF_NAME", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({});

    expect(() => new Inputs()).toThrow(/version.*ref-name/);
  });

  it("respects explicit overrides", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    setupGetInput({
      version: "6.4.0",
      repository: "custom/override-repo",
      "project-slug": "override-slug",
      "projects-api-base": "http://localhost:9999",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("custom/override-repo");
    expect(inputs.projectSlug).toBe("override-slug");
    expect(inputs.projectsApiBase).toBe("http://localhost:9999");
  });
});
