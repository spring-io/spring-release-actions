import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.repositoryUrl =
      core.getInput("repository-url") || "https://repo1.maven.org/maven2";
    this.artifactPath = core.getInput("artifact-path", { required: true });
    this.version = core.getInput("version", { required: true });
    this.username = core.getInput("repository-username") || "";
    this.password = core.getInput("repository-password") || "";
    const timeoutStr = core.getInput("timeout");
    this.timeout = timeoutStr ? parseInt(timeoutStr, 10) : 0;
    Object.freeze(this);
  }
}

export { Inputs };
