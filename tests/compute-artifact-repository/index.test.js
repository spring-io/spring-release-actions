import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { run } = await import(
  "../../src/compute-artifact-repository/index.js"
);

describe("compute-artifact-repository", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("OSS repository", () => {
    it("outputs repo1.maven.org and maven2 for a GA release", async () => {
      await run({ version: "6.5.8", repository: "spring-projects/spring-security" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://repo1.maven.org");
      expect(core.setOutput).toHaveBeenCalledWith("name", "maven2");
    });

    it("outputs repo.spring.io and libs-snapshot-local for a SNAPSHOT", async () => {
      await run({ version: "6.5.9-SNAPSHOT", repository: "spring-projects/spring-security" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://repo.spring.io");
      expect(core.setOutput).toHaveBeenCalledWith("name", "libs-snapshot-local");
    });
  });

  describe("commercial repository", () => {
    it("outputs broadcom URI and prod-local for a GA release", async () => {
      await run({ version: "6.5.8", repository: "spring-projects/spring-security-commercial" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://usw1.packages.broadcom.com");
      expect(core.setOutput).toHaveBeenCalledWith("name", "spring-enterprise-maven-prod-local");
    });

    it("outputs broadcom URI and dev-local for a SNAPSHOT", async () => {
      await run({ version: "6.5.9-SNAPSHOT", repository: "spring-projects/spring-security-commercial" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://usw1.packages.broadcom.com");
      expect(core.setOutput).toHaveBeenCalledWith("name", "spring-enterprise-maven-dev-local");
    });

    it("outputs broadcom URI and stage-local for a release candidate", async () => {
      await run({ version: "6.5.0-RC1", repository: "spring-projects/spring-security-commercial" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://usw1.packages.broadcom.com");
      expect(core.setOutput).toHaveBeenCalledWith("name", "spring-enterprise-maven-stage-local");
    });

    it("outputs broadcom URI and stage-local for a milestone", async () => {
      await run({ version: "6.5.0-M1", repository: "spring-projects/spring-security-commercial" });

      expect(core.setOutput).toHaveBeenCalledWith("uri", "https://usw1.packages.broadcom.com");
      expect(core.setOutput).toHaveBeenCalledWith("name", "spring-enterprise-maven-stage-local");
    });
  });
});
