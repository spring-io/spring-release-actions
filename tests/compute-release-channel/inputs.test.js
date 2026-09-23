import { vi } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { Inputs } from "../../src/compute-release-channel/inputs.js";

vi.mock(
  "@actions/core",
  async () => await import("../../__fixtures__/core.js"),
);

function setupInputs(map, boolMap = {}) {
  core.getInput.mockImplementation((name, options) => {
    const value = map[name] ?? "";
    if (options?.required && !value) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return value;
  });
  core.getBooleanInput.mockImplementation((name) => {
    if (!(name in boolMap)) {
      throw new Error(`no boolean input stubbed for '${name}'`);
    }
    return boolMap[name];
  });
}

describe("compute-release-channel Inputs constructor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads version, private, and repository", () => {
    setupInputs(
      {
        version: "5.7.29",
        repository: "spring-projects/spring-security",
      },
      { private: true },
    );

    const inputs = new Inputs();

    expect(inputs.version).toBe("5.7.29");
    expect(inputs.private).toBe(true);
    expect(inputs.repository).toBe("spring-projects/spring-security");
    expect(inputs.projectSlug).toBe("spring-security");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("requires version", () => {
    setupInputs(
      { repository: "spring-projects/spring-security" },
      { private: false },
    );

    expect(() => new Inputs()).toThrow(/version/);
  });

  it("strips -commercial from repository name for projectSlug", () => {
    setupInputs(
      {
        version: "5.7.29",
        repository: "spring-projects/spring-security-commercial",
      },
      { private: true },
    );

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-security");
  });

  it("does not validate repository when project-slug is given", () => {
    setupInputs(
      { version: "5.7.29", repository: "", "project-slug": "spring-security" },
      { private: true },
    );

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-security");
  });

  it("rejects a repository that is not in owner/repo format", () => {
    setupInputs(
      { version: "5.7.29", repository: "spring-security" },
      { private: true },
    );

    expect(() => new Inputs()).toThrow(/owner\/repo/);
  });

  it("respects explicit overrides", () => {
    setupInputs(
      {
        version: "5.7.29",
        repository: "custom/override-repo",
        "project-slug": "override-slug",
        "projects-api-base": "http://localhost:9999",
      },
      { private: false },
    );

    const inputs = new Inputs();

    expect(inputs.repository).toBe("custom/override-repo");
    expect(inputs.projectSlug).toBe("override-slug");
    expect(inputs.projectsApiBase).toBe("http://localhost:9999");
  });
});
