import * as core from "@actions/core";
import axios from "axios";

const PROJECT_KEY = "spring";
const BUILD_REPOSITORY = "spring-build-info";

/**
 * A class for creating a JFrog release bundle
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
    const response = await axios.post(url, body, {
      auth: this.auth,
      headers: { "X-JFrog-Signing-Key-Name": "packagesKey" },
    });
    core.info(`Release bundle created`);
    return response.data;
  }
}

export { ReleaseBundle };
