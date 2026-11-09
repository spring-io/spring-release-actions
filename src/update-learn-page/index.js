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

  // The repository decides, not the presence of a token: the Projects API only
  // knows the OSS releases, and there is none for the commercial ones, which
  // are edited in the website repository. So a commercial release needs the
  // token that can do that, and an OSS release never uses it.
  if (inputs.commercial && !inputs.websiteToken) {
    core.setFailed(
      "A commercial release needs a website-token: the Spring Projects API is only for OSS releases",
    );
    return;
  }

  try {
    if (inputs.commercial) {
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
