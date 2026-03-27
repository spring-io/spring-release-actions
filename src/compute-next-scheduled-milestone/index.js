import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Milestones } from "../milestones.js";
import { Version } from "../versions.js";

async function run(inputs = new Inputs()) {
  const milestones = new Milestones(
    inputs.milestoneToken,
    inputs.milestoneRepository,
    core,
  );
  const version = new Version(inputs.version);
  if (!version.snapshot) {
    core.warning("Version is not a snapshot; no release version to determine.");
    core.setOutput("release-version", "");
    core.setOutput("days-til-release", "");
    return;
  }
  const milestone = await milestones.findNextOpenMilestoneForGeneration({
    major: version.major,
    minor: version.minor,
  });
  if (!milestone) {
    core.warning("No upcoming milestone found for the generation.");
    core.setOutput("release-version", "");
    core.setOutput("days-til-release", "");
    return;
  }
  const days = _daysTilRelease(milestone.dueDate);
  core.info(
    `Next scheduled release version is ${milestone.name} in ${days} day(s)`,
  );
  core.setOutput("release-version", milestone.name);
  core.setOutput("days-til-release", days);
}

function _daysTilRelease(dueDate) {
  const today = new Date();
  const todayNorm = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dueDateNorm = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );
  return Math.round((dueDateNorm - todayNorm) / (24 * 60 * 60 * 1000));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run, _daysTilRelease };
