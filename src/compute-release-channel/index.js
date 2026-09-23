import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Website } from "../website.js";
import { Version } from "../versions.js";
import { classifySupportPhase } from "../support-phase.js";

async function run(inputs = new Inputs(), now = new Date()) {
  const version = new Version(inputs.version);
  if (Number.isNaN(version.major) || Number.isNaN(version.minor)) {
    core.setFailed(`Could not parse a version from '${inputs.version}'.`);
    return;
  }

  if (!Number.isNaN(version.build)) {
    if (inputs.private) {
      core.info(
        `${version.version} is a four-digit version; classifying as 'hotfix'.`,
      );
      core.setOutput("channel", "hotfix");
      return;
    }
    core.setFailed(
      `${version.version} is a four-digit version in a public repository; a hotfix line in a public repository is a configuration error.`,
    );
    return;
  }

  if (version.classifier === "INTERNAL") {
    if (inputs.private) {
      core.info(
        `${version.version} is an '-INTERNAL' version; classifying as 'internal'.`,
      );
      core.setOutput("channel", "internal");
      return;
    }
    core.setFailed(
      `${version.version} is an '-INTERNAL' version in a public repository; an internal version in a public repository is a configuration error.`,
    );
    return;
  }

  const projects = new Website(inputs, core);
  let generation;
  try {
    generation = await projects.getGenerationByVersion(version);
  } catch (error) {
    core.setFailed(error.message);
    return;
  }
  if (!generation) {
    _fallback(
      inputs,
      `Could not find generation data for ${version.major}.${version.minor}`,
    );
    return;
  }

  const today = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  const phase = classifySupportPhase(
    today,
    generation.oss.end,
    generation.enterprise.end,
  );
  const channel = _decide(phase, inputs.private);
  if (!channel) {
    core.setFailed(
      `Could not determine a release channel for generation ${version.major}.${version.minor} (support phase '${phase}', private=${inputs.private}).`,
    );
    return;
  }

  core.info(
    `Resolved release channel '${channel}' for generation ${version.major}.${version.minor} (support phase '${phase}', private=${inputs.private}).`,
  );
  core.setOutput("channel", channel);
}

function _fallback(inputs, reason) {
  const channel = inputs.private ? "internal" : "oss";
  core.info(
    `${reason}; classifying as '${channel}' based on repository visibility alone.`,
  );
  core.setOutput("channel", channel);
}

function _decide(phase, isPrivate) {
  if (phase === "oss") {
    return isPrivate ? "internal" : "oss";
  }
  if (phase === "commercial") {
    return isPrivate ? "lts" : null;
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => core.setFailed(error.message));
}

export { run };
