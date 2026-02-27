import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Milestones } from "../milestones.js";
import { Website } from "../website.js";
import { Version } from "../versions.js";

async function run(inputs = new Inputs()) {
  const milestones = new Milestones(inputs.token, inputs.repository);
  const projects = new Website(inputs);
  const version = await _getVersion(milestones, inputs);
  if (!version) {
    core.setFailed(
      `Could not find milestone ${inputs.version} or it has no due date.`,
    );
    return;
  }
  const generation = await _getGeneration(projects, version);
  if (!generation) {
    core.setFailed(`Could not find generation for version ${inputs.version}.`);
    return;
  }
  const release = version.nextMilestone(generation);
  if (!release) {
    core.setFailed(
      `Could not calculate next release for version ${inputs.version}.`,
    );
    return;
  }
  const nextVersion = release.version;
  const nextVersionType = release.type;
  const nextVersionDate = release.dueDate.toISOString().substring(0, 10);
  core.info(
    `Next version is ${nextVersion} (${nextVersionType}) on ${nextVersionDate}`,
  );
  core.setOutput("version", nextVersion);
  core.setOutput("version-date", nextVersionDate);
  core.setOutput("version-type", nextVersionType);
}

async function _getVersion(milestones, inputs) {
  const milestone = await milestones.findMilestoneByTitle(inputs.version);
  if (!milestone || !milestone.dueDate) {
    return null;
  }
  return Version.fromMilestone(milestone);
}

async function _getGeneration(projects, version) {
  try {
    return await projects.getGenerationByVersion(version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
