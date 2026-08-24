import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/schedule-milestone/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("schedule-milestone Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("settles version, versionDate, description, repository, token from inputs and env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "3.3.0",
      "version-date": "2025-04-01",
      description: "Release 3.3.0",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.version).toBe("3.3.0");
    expect(inputs.versionDate).toBe("2025-04-01");
    expect(inputs.description).toBe("Release 3.3.0");
    expect(inputs.repository).toBe("spring-projects/spring-boot");
    expect(inputs.token).toBe("env-token");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("uses explicit repository and token over env", () => {
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_TOKEN = "env-token";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      repository: "custom/repo",
      token: "input-token",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("custom/repo");
    expect(inputs.token).toBe("input-token");
  });

  it("strips -commercial from the repository when version-type is oss", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security-commercial";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      "version-type": "oss",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security");
  });

  it("leaves an already-oss repository alone when version-type is oss", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      "version-type": "oss",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security");
  });

  it("appends -commercial to the repository when version-type is not oss", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      "version-type": "enterprise",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security-commercial");
  });

  it("leaves an already-commercial repository alone when version-type is not oss", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security-commercial";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      "version-type": "enterprise",
      repository: "",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-security-commercial");
  });

  it("prefers an explicit repository over version-type", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security";
    setupGetInput({
      version: "1.0.0",
      "version-date": "",
      description: "",
      "version-type": "oss",
      repository: "custom/repo",
      token: "",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("custom/repo");
  });
});
