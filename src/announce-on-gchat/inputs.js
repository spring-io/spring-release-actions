import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.gchatWebhookUrl = core.getInput("gchat-webhook-url");
    this.version = core.getInput("version");
    this._projectName = core.getInput("project-name", { required: false });
  }

  get projectName() {
    return this._projectName || process.env.GITHUB_REPOSITORY.split("/")[1];
  }
}

export { Inputs };
