import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.gchatWebhookUrl = core.getInput("gchat-webhook-url");
    this.version = core.getInput("version");
    this.versionDate = core.getInput("version-date");
    this.projectName =
      core.getInput("project-name", { required: false }) ||
      process.env.GITHUB_REPOSITORY.split("/")[1];
    Object.freeze(this);
  }
}

export { Inputs };
