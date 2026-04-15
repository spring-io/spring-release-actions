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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads version and repository", () => {
    setupGetInput({
      version: "6.4.16-SNAPSHOT",
      repository: "spring-projects/spring-security",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.4.16-SNAPSHOT");
    expect(inputs.repository).toBe("spring-projects/spring-security");
    expect(inputs.projectSlug).toBe("spring-security");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("strips -commercial from repository name for projectSlug", () => {
    setupGetInput({
      version: "6.4.x",
      repository: "spring-projects/spring-security-commercial",
    });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-security");
  });

  it("derives projectSlug from the repository input, not the env var", () => {
    setupGetInput({
      version: "6.4.x",
      repository: "custom/override-repo",
    });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("override-repo");
  });

  it("rejects a repository that is not in owner/repo format", () => {
    setupGetInput({
      version: "6.4.x",
      repository: "spring-security",
    });

    expect(() => new Inputs()).toThrow(/owner\/repo/);
  });

  it("rejects an empty owner or repo segment", () => {
    setupGetInput({
      version: "6.4.x",
      repository: "spring-projects/",
    });

    expect(() => new Inputs()).toThrow(/owner\/repo/);
  });

  it("does not validate repository when project-slug is given", () => {
    setupGetInput({
      version: "6.4.x",
      repository: "",
      "project-slug": "spring-security",
    });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-security");
  });

  it("requires a version", () => {
    setupGetInput({ repository: "spring-projects/spring-security" });

    expect(() => new Inputs()).toThrow(/version/);
  });

  it("respects explicit overrides", () => {
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
