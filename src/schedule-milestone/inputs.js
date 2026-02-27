import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version");
    this.versionDate = core.getInput("version-date");
    this.description = core.getInput("description");
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    Object.freeze(this);
  }
}

export { Inputs };
