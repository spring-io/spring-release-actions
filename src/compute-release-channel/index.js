import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Website } from "../website.js";
import { resolveVersion } from "./resolve-version.js";
import { classifySupportPhase } from "../support-phase.js";

async function run(inputs = new Inputs(), now = new Date()) {
  const resolved = resolveVersion({ ref: inputs.ref, version: inputs.version });

  if (!resolved) {
    _fallback(inputs, `Could not derive a version from ref '${inputs.ref}'`);
    return;
  }

  if (resolved.internalBranch && !inputs.private) {
    core.setFailed(
      `'${inputs.ref}' is an '-internal' branch, but the repository isn't private; an internal branch in a public repository is a configuration error.`,
    );
    return;
  }

  if (resolved.fourDigit) {
    core.info(
      `${resolved.version.version} is a four-digit version; classifying as 'hotfix'.`,
    );
    core.setOutput("channel", "hotfix");
    return;
  }

  if (resolved.unpublished) {
    _fallback(
      inputs,
      `${resolved.version.version} is a milestone/RC or first-GA release, so the support calendar may not yet reflect this generation`,
    );
    return;
  }

  const projects = new Website(inputs, core);
  let generation;
  try {
    generation = await projects.getGenerationByVersion(resolved.version);
  } catch (error) {
    core.setFailed(error.message);
    return;
  }
  if (!generation) {
    _fallback(
      inputs,
      `Could not find generation data for ${resolved.version.major}.${resolved.version.minor}`,
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
      `Could not determine a release channel for generation ${resolved.version.major}.${resolved.version.minor} (support phase '${phase}', private=${inputs.private}).`,
    );
    return;
  }

  core.info(
    `Resolved release channel '${channel}' for generation ${resolved.version.major}.${resolved.version.minor} (support phase '${phase}', private=${inputs.private}).`,
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
