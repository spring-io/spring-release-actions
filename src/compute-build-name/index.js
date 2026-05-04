import * as core from "@actions/core";
import { Inputs } from "./inputs.js";

async function run(inputs = new Inputs()) {
  const repositoryName = inputs.repository.split("/").pop();
  let versionPart;
  if (inputs.version.includes("-SNAPSHOT")) {
    const parts = inputs.version.split(".");
    versionPart = `${parts[0]}.${parts[1]}.x`;
  } else {
    versionPart = inputs.version;
  }
  const buildName = `${repositoryName}-${versionPart}`;

  core.info(`Build name: ${buildName}`);
  core.setOutput("build-name", buildName);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
