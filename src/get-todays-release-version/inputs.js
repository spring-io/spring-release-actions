import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("snapshot-version", { required: true });
    this.milestoneRepository =
      core.getInput("milestone-repository") || process.env.GITHUB_REPOSITORY;
    this.milestoneToken =
      core.getInput("milestone-token") || process.env.GITHUB_TOKEN;
  }
}

export { Inputs };
