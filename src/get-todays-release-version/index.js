import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Milestones } from "../milestones.js";
import { Version } from "../versions.js";

const inputs = new Inputs();
const milestones = new Milestones(
  inputs.milestoneToken,
  inputs.milestoneRepository,
);

async function run() {
  const version = new Version(inputs.version);
  if (!version.snapshot) {
    core.warning("Version is not a snapshot; no release version to determine.");
    core.setOutput("release-version", "");
    return;
  }
  const milestone = await milestones.findOpenMilestoneDueTodayForGeneration({
    major: version.major,
    minor: version.minor,
  });
  if (!milestone) {
    core.warning("No milestone due today for the generation.");
    core.setOutput("release-version", "");
    return;
  }
  core.info(`Today's release version is ${milestone.name}`);
  core.setOutput("release-version", milestone.name);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
