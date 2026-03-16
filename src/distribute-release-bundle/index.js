import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { ReleaseBundle } from "./release-bundle.js";

async function run(inputs = new Inputs()) {
  const bundle = new ReleaseBundle(inputs);
  try {
    core.info(`Creating release bundle ${inputs.bundleName}@${inputs.version}`);
    await bundle.create();
    core.info(
      `Distributing release bundle ${inputs.bundleName}@${inputs.version}`,
    );
    await bundle.distribute();
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
