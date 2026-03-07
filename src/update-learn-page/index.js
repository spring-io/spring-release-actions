import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { updateViaGithub, buildUpdatedPage } from "./github-strategy.js";
import { updateViaApi } from "./api-strategy.js";

async function run(inputs = new Inputs()) {
  if (inputs.version.endsWith("-SNAPSHOT")) {
    core.setFailed(
      "Please specify a non-SNAPSHOT release version to publish; it's accompanying SNAPSHOT version will also be published",
    );
    return;
  }

  try {
    if (inputs.websiteToken) {
      await updateViaGithub(inputs);
    } else {
      await updateViaApi(inputs);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run, buildUpdatedPage };
