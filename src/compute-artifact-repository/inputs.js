import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    Object.freeze(this);
  }
}

export { Inputs };
