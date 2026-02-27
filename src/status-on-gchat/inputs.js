import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.gchatWebhookUrl = core.getInput("gchat-webhook-url");
    this.token =
      core.getInput("token", { required: false }) || process.env.GITHUB_TOKEN;
    Object.freeze(this);
  }
}

export { Inputs };
