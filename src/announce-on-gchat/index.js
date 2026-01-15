import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { Announce } from "../gchat.js";

async function run() {
  const inputs = new Inputs();
  const announce = new Announce(inputs.gchatWebhookUrl, inputs.projectName);
  try {
    await announce.announceRelease(inputs.version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
