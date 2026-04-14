import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Website } from "../website.js";
import { Version } from "../versions.js";

async function run(inputs = new Inputs(), now = new Date()) {
  const version = _resolveVersion(inputs);
  if (!version) {
    core.setFailed(
      `Could not derive a major.minor from version='${inputs.version}' or ref-name='${inputs.refName}'.`,
    );
    return;
  }
  const projects = new Website(inputs, core);
  const generation = await _getGeneration(projects, version);
  if (!generation) {
    core.setFailed(
      `Could not find generation for ${version.major}.${version.minor}.`,
    );
    return;
  }
  const today = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const ossEnd = generation.oss.end;
  const commercialEnd = generation.enterprise.end;
  const supportType = _classify(today, ossEnd, commercialEnd);
  const ossEndStr = _formatYearMonth(ossEnd);
  const commercialEndStr = _formatYearMonth(commercialEnd);
  core.info(
    `Support window for ${version.major}.${version.minor}: oss ends ${ossEndStr}, commercial ends ${commercialEndStr} -> ${supportType}`,
  );
  core.setOutput("support-type", supportType);
  core.setOutput("oss-end", ossEndStr);
  core.setOutput("commercial-end", commercialEndStr);
}

function _resolveVersion(inputs) {
  if (inputs.version) {
    const v = new Version(inputs.version);
    if (Number.isNaN(v.major) || Number.isNaN(v.minor)) {
      return null;
    }
    return v;
  }
  return _versionFromRefName(inputs.refName);
}

function _versionFromRefName(refName) {
  const stripped = refName.replace(/^refs\/(heads|tags)\//, "");
  const match = stripped.match(/^(\d+)\.(\d+)(?:\.|$|-)/);
  if (!match) {
    return null;
  }
  return new Version(`${match[1]}.${match[2]}.0`);
}

function _classify(today, ossEnd, commercialEnd) {
  if (_onOrBefore(today, ossEnd)) {
    return "oss";
  }
  if (_onOrBefore(today, commercialEnd)) {
    return "commercial";
  }
  return "eol";
}

function _onOrBefore(today, end) {
  if (today.year !== end.year) {
    return today.year < end.year;
  }
  return today.month <= end.month;
}

function _formatYearMonth({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}`;
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
