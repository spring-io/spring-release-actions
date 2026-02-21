import * as core from "@actions/core";

class Inputs {
  constructor() {
    this._repositoryUrl =
      core.getInput("repository-url") || "https://repo1.maven.org/maven2";
    this._artifactPath = core.getInput("artifact-path", { required: true });
    this._version = core.getInput("version", { required: true });
    this._username = core.getInput("repository-username") || "";
    this._password = core.getInput("repository-password") || "";
    const timeoutStr = core.getInput("timeout");
    this._timeout = timeoutStr ? parseInt(timeoutStr, 10) : 0;
  }

  get repositoryUrl() {
    return this._repositoryUrl;
  }

  get artifactPath() {
    return this._artifactPath;
  }

  get version() {
    return this._version;
  }

  get username() {
    return this._username;
  }

  get password() {
    return this._password;
  }

  get timeout() {
    return this._timeout;
  }
}

export { Inputs };
