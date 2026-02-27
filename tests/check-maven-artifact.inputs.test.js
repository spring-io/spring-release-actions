import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../src/check-maven-artifact/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("check-maven-artifact Inputs constructor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("settles repositoryUrl, artifactPath, version, username, password, timeout from inputs with defaults", () => {
    setupGetInput({
      "repository-url": "",
      "artifact-path": "org/springframework/spring-core",
      version: "6.1.0",
      "repository-username": "",
      "repository-password": "",
      timeout: "",
    });

    const inputs = new Inputs();

    expect(inputs.repositoryUrl).toBe("https://repo1.maven.org/maven2");
    expect(inputs.artifactPath).toBe("org/springframework/spring-core");
    expect(inputs.version).toBe("6.1.0");
    expect(inputs.username).toBe("");
    expect(inputs.password).toBe("");
    expect(inputs.timeout).toBe(0);
    expect(Object.isFrozen(inputs)).toBe(true);
  });

  it("parses timeout as integer and uses explicit repository-url and credentials", () => {
    setupGetInput({
      "repository-url": "https://custom.repo/maven2",
      "artifact-path": "com/example/foo",
      version: "1.0.0",
      "repository-username": "user",
      "repository-password": "pass",
      timeout: "5",
    });

    const inputs = new Inputs();

    expect(inputs.repositoryUrl).toBe("https://custom.repo/maven2");
    expect(inputs.username).toBe("user");
    expect(inputs.password).toBe("pass");
    expect(inputs.timeout).toBe(5);
  });
});
