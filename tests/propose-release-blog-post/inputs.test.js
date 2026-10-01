import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/propose-release-blog-post/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("propose-release-blog-post Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("defaults repository, token, project-name, year, month, author from env", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    process.env.GITHUB_TOKEN = "env-token";
    process.env.GITHUB_ACTOR = "octocat";
    setupGetInput({ "website-token": "website-token-value" });

    const now = new Date();
    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-boot");
    expect(inputs.token).toBe("env-token");
    expect(inputs.projectName).toBe("spring-boot");
    expect(inputs.year).toBe(now.getUTCFullYear());
    expect(inputs.month).toBe(now.getUTCMonth() + 1);
    expect(inputs.author).toBe("octocat");
    expect(inputs.websiteToken).toBe("website-token-value");
    expect(inputs.websiteRepository).toBe("spring-io/spring-website-content");
    expect(inputs.baseBranch).toBe("main");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("strips -commercial from the derived project name", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-security-commercial";
    setupGetInput({ "website-token": "token" });

    const inputs = new Inputs();

    expect(inputs.projectName).toBe("spring-security");
  });

  it("prefers explicit inputs over defaults", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    process.env.GITHUB_ACTOR = "octocat";
    setupGetInput({
      repository: "spring-projects/spring-data-jpa",
      token: "input-token",
      "project-name": "spring-data",
      year: "2025",
      month: "3",
      author: "custom-author",
      "website-token": "token",
      "website-repository": "spring-io/spring-website-commercial-content",
      "base-branch": "next",
    });

    const inputs = new Inputs();

    expect(inputs.repository).toBe("spring-projects/spring-data-jpa");
    expect(inputs.token).toBe("input-token");
    expect(inputs.projectName).toBe("spring-data");
    expect(inputs.year).toBe(2025);
    expect(inputs.month).toBe(3);
    expect(inputs.author).toBe("custom-author");
    expect(inputs.websiteRepository).toBe("spring-io/spring-website-commercial-content");
    expect(inputs.baseBranch).toBe("next");
  });
});
