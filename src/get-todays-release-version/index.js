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
    core.setOutput("release-version", "");
    return;
  }
  const milestone = milestones.findOpenMilestoneDueTodayForGeneration({
    major: version.major,
    minor: version.minor,
  });
  if (!milestone) {
    core.setOutput("release-version", "");
    return;
  }
  console.log(`Today's release version is ${milestone.name}`);
  core.setOutput("release-version", milestone.name);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
