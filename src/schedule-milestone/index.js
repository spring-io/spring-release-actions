import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { Milestones } from "../milestones.js";

async function run(inputs = new Inputs()) {
  const milestones = new Milestones(inputs.token, inputs.repository);
  try {
    await milestones.scheduleMilestone(
      inputs.version,
      inputs.versionDate,
      inputs.description,
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export default run;
