import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Website } from "../website.js";
import { Version } from "../versions.js";
import { classifySupportPhase } from "../support-phase.js";

async function run(inputs = new Inputs(), now = new Date()) {
  const version = _resolveVersion(inputs.version);
  if (!version) {
    core.setFailed(`Could not derive a major.minor from '${inputs.version}'.`);
    return;
  }
  if (!Number.isNaN(version.build)) {
    core.info(
      `${version.version} is a four-digit version; treating as commercial without a generation lookup.`,
    );
    core.setOutput("support-type", "commercial");
    _setRepositoryMatch(inputs, "commercial");
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
    core.setFailed(
      `Could not find generation for ${version.major}.${version.minor}.`,
    );
    return;
  }
  const today = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  const ossEnd = generation.oss.end;
  const commercialEnd = generation.enterprise.end;
  const supportType = classifySupportPhase(today, ossEnd, commercialEnd);
  const ossEndStr = _formatYearMonth(ossEnd);
  const commercialEndStr = _formatYearMonth(commercialEnd);
  core.info(
    `Support window for ${version.major}.${version.minor}: oss ends ${ossEndStr}, commercial ends ${commercialEndStr} -> ${supportType}`,
  );
  core.setOutput("support-type", supportType);
  core.setOutput("oss-end", ossEndStr);
  core.setOutput("commercial-end", commercialEndStr);
  _setRepositoryMatch(inputs, supportType);
}

function _setRepositoryMatch(inputs, supportType) {
  const isCommercialRepo = inputs.repository.endsWith("-commercial");
  const matches =
    (supportType === "commercial" && isCommercialRepo) ||
    (supportType === "oss" && !isCommercialRepo);
  core.setOutput("repository-matches-support-window", matches);
}

function _resolveVersion(input) {
  const stripped = input.replace(/^refs\/(heads|tags)\//, "");
  const v = new Version(stripped);
  if (Number.isNaN(v.major) || Number.isNaN(v.minor)) {
    return null;
  }
  return v;
}

function _formatYearMonth({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => core.setFailed(error.message));
}

export { run };
