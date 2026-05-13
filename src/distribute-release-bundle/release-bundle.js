import * as core from "@actions/core";
import axios from "axios";

const PROJECT_KEY = "spring";
const BUILD_REPOSITORY = "spring-build-info";
const SOURCE_REPO = "spring-enterprise-maven-prod-local";
const DIST_REPO = "spring-enterprise";
const DIST_SITE = "JP-SaaS";

/**
 * A class for creating and distributing a JFrog release bundle
 */
class ReleaseBundle {
  constructor(inputs) {
    this.baseUrl = inputs.artifactoryUrl.replace(/\/$/, "");
    this.bundleName = inputs.bundleName;
    this.version = inputs.version;
    this.buildName = inputs.buildName;
    this.buildNumber = inputs.buildNumber;
    this.auth = { username: inputs.username, password: inputs.password };
  }

  get createUrl() {
    return `${this.baseUrl}/lifecycle/api/v2/release_bundle?project=${PROJECT_KEY}&async=false`;
  }

  get recordUrl() {
    return `${this.baseUrl}/lifecycle/api/v2/release_bundle/records/${this.bundleName}/${this.version}?project=${PROJECT_KEY}`;
  }

  get distributeUrl() {
    return `${this.baseUrl}/lifecycle/api/v2/distribution/distribute/${this.bundleName}/${this.version}?project=${PROJECT_KEY}`;
  }

  async create() {
    const url = this.createUrl;
    core.info(`Creating release bundle at ${url}`);
    const body = {
      release_bundle_name: this.bundleName,
      release_bundle_version: this.version,
      skip_docker_manifest_resolution: true,
      source_type: "builds",
      source: {
        builds: [
          {
            build_repository: BUILD_REPOSITORY,
            build_name: this.buildName,
            build_number: this.buildNumber,
            include_dependencies: false,
          },
        ],
      },
    };
    try {
      const response = await axios.post(url, body, {
        auth: this.auth,
        headers: { "X-JFrog-Signing-Key-Name": "packagesKey" },
      });
      core.info(`Release bundle created`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 409) {
        throw error;
      }
      const existing = await axios.get(this.recordUrl, { auth: this.auth });
      const artifacts = existing.data.artifacts ?? [];
      if (this.#matchesBuild(artifacts)) {
        core.warning(
          `Release bundle ${this.bundleName}@${this.version} already exists from build ${this.buildName}#${this.buildNumber}; did not replace`,
        );
        return existing.data;
      }
      throw error;
    }
  }

  async distribute() {
    const url = this.distributeUrl;
    core.info(`Distributing release bundle at ${url}`);
    const body = {
      auto_create_missing_repositories: false,
      distribution_rules: [{ site_name: DIST_SITE }],
      modifications: {
        mappings: [{ input: `${SOURCE_REPO}/(.*)`, output: `${DIST_REPO}/$1` }],
      },
    };
    try {
      const response = await axios.post(url, body, { auth: this.auth });
      core.info(`Release bundle distributed successfully`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 409) {
        throw error;
      }
      core.warning(
        `Release bundle ${this.bundleName}@${this.version} has already been distributed; did not redistribute`,
      );
    }
  }

  #matchesBuild(artifacts) {
    const buildNames = new Set();
    const buildNumbers = new Set();
    for (const artifact of artifacts) {
      for (const prop of artifact.properties ?? []) {
        if (prop.key === "build.name")
          prop.values.forEach((v) => buildNames.add(v));
        if (prop.key === "build.number")
          prop.values.forEach((v) => buildNumbers.add(v));
      }
    }
    return (
      buildNames.size === 1 &&
      buildNames.has(this.buildName) &&
      buildNumbers.size === 1 &&
      buildNumbers.has(this.buildNumber)
    );
  }
}

export { ReleaseBundle };
