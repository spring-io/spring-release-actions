import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/update-learn-page/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

function setupGetBooleanInput(map) {
  core.getBooleanInput.mockImplementation((name) => map[name] ?? false);
}

describe("update-learn-page Inputs constructor", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("settles all properties with defaults and projectSlug/commercial/websiteRepository derived from projectName", () => {
    process.env.GITHUB_REPOSITORY = "spring-projects/spring-boot";
    setupGetInput({
      version: "3.2.0",
      "website-token": "token",
      "api-doc-url": "",
      "is-antora": "",
      "ref-doc-url": "",
      "project-name": "",
      "website-repository": "",
    });
    setupGetBooleanInput({ "is-antora": false });

    const inputs = new Inputs();

    expect(inputs.version).toBe("3.2.0");
    expect(inputs.websiteToken).toBe("token");
    expect(inputs.apiDocUrl).toBe(
      "https://docs.spring.io/{project}/site/docs/{version}/api/"
    );
    expect(inputs.isAntora).toBe(false);
    expect(inputs.refDocUrl).toBe(
      "https://docs.spring.io/{project}/reference/{version}/index.html"
    );
    expect(inputs.projectName).toBe("spring-projects/spring-boot");
    expect(inputs.projectSlug).toBe("spring-boot");
    expect(inputs.commercial).toBe(false);
    expect(inputs.websiteRepository).toBe("spring-io/spring-website-content");
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("strips -commercial from projectSlug when projectName includes commercial", () => {
    setupGetInput({
      version: "3.0.0",
      "website-token": "token",
      "api-doc-url": "https://custom.api/",
      "ref-doc-url": "https://custom.ref/",
      "project-name": "spring-projects/spring-boot-commercial",
      "website-repository": "",
    });
    setupGetBooleanInput({ "is-antora": true });

    const inputs = new Inputs();

    expect(inputs.projectSlug).toBe("spring-boot");
    expect(inputs.commercial).toBe(true);
    expect(inputs.websiteRepository).toBe(
      "spring-io/spring-website-commercial-content"
    );
    expect(inputs.apiDocUrl).toBe("https://custom.api/");
    expect(inputs.refDocUrl).toBe("https://custom.ref/");
    expect(inputs.isAntora).toBe(true);
  });

  it("uses explicit website-repository when provided", () => {
    setupGetInput({
      version: "1.0.0",
      "website-token": "token",
      "api-doc-url": "",
      "ref-doc-url": "",
      "project-name": "spring-projects/spring-framework",
      "website-repository": "custom/website-repo",
    });
    setupGetBooleanInput({ "is-antora": false });

    const inputs = new Inputs();

    expect(inputs.websiteRepository).toBe("custom/website-repo");
  });
});
