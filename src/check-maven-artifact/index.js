import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { MavenArtifact } from "../maven.js";

async function run(inputs = new Inputs()) {
  const artifact = new MavenArtifact(
    inputs.repositoryUrl,
    inputs.artifactPath,
    inputs.version,
    inputs.username,
    inputs.password,
  );
  try {
    let found;
    if (inputs.timeout > 0) {
      core.info(
        `Waiting up to ${inputs.timeout} minute(s) for ${artifact.url}`,
      );
      found = await artifact.waitFor(inputs.timeout);
    } else {
      found = await artifact.exists();
    }
    core.setOutput("found", found);
    if (found) {
      core.info(`Artifact found: ${artifact.url}`);
    } else {
      core.setFailed(`Artifact not found: ${artifact.url}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export default run;
