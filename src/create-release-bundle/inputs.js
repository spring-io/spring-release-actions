import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.artifactoryUrl = core.getInput("artifactory-url");
    this.bundleName = core.getInput("bundle-name");
    this.version = core.getInput("version", { required: true });
    this.buildName = core.getInput("build-name");
    this.buildNumber = core.getInput("build-number");
    this.username = core.getInput("username", { required: true });
    this.password = core.getInput("password", { required: true });
    Object.freeze(this);
  }
}

export { Inputs };
