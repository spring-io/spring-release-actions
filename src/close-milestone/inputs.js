import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
  }
}

export { Inputs };
