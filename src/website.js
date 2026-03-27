import { readFile } from "fs/promises";
import { join } from "path";
import { getWeekOfMonthAndDayOfWeek } from "./lib.js";

const PROJECTS_API_BASE = "https://api.spring.io";

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * Class for interacting with Spring project metadata via the
 * <a href="https://api.spring.io/projects">Projects API</a>.
 *
 * @author Josh Cummings
 */
class Website {
  constructor(inputs, core = _noOpCore) {
    this.projectSlug = inputs.projectSlug;
    this.apiBase = inputs.projectsApiBase || PROJECTS_API_BASE;
    this.core = core;
  }

  /**
   * Look up generate data using the major and minor version numbers in
   * the supplied {@linkcode Version}.
   * @param version
   * @returns {Promise<{generation: {major: number, minor: number}, dayOfWeek: *, weekOfMonth: number, oss: {frequency: number, offset: number, end: {year: number, month: number}}, enterprise: {frequency: number, offset: number, end: {year: number, month: number}}}|null>}
   */
  async getGenerationByVersion(version) {
    const generations = await _fetchGenerations(
      this.apiBase,
      this.projectSlug,
      this.core,
    );
    const { dayOfWeek, weekOfMonth } = getWeekOfMonthAndDayOfWeek(
      version.dueDate,
    );
    for (const generation of generations) {
      this.core.debug(
        `Checking generation ${generation.name} against ${version.major}.${version.minor}`,
      );
      const majorMinor = _generation(generation.name);
      if (version.isSameMajorMinor(majorMinor)) {
        return {
          major: majorMinor.major,
          minor: majorMinor.minor,
          dayOfWeek,
          weekOfMonth,
          oss: {
            frequency: 1,
            offset: 0,
            end: _date(generation.ossSupportEndDate),
          },
          enterprise: {
            frequency: 3,
            offset: 1,
            end: _date(generation.commercialSupportEndDate),
          },
        };
      }
    }
    return null;
  }
}

async function _fetchGenerations(apiBase, projectSlug, core) {
  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return _fetchGenerationsFromHttp(apiBase, projectSlug, core);
  }
  return _fetchGenerationsFromFilesystem(apiBase, projectSlug, core);
}

async function _fetchGenerationsFromHttp(apiBase, projectSlug, core) {
  const url = `${apiBase}/projects/${projectSlug}/generations`;
  try {
    core.info(`Retrieving generations from ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Projects API returned ${response.status} for ${url}: ${response.statusText}`,
      );
    }
    const body = await response.json();
    const generations = body._embedded?.generations;
    if (!Array.isArray(generations)) {
      throw new Error(
        `Unexpected response from Projects API: missing _embedded.generations`,
      );
    }
    return generations;
  } catch (error) {
    core.error(`Error retrieving generations: ${error.message}`);
    throw error;
  }
}

async function _fetchGenerationsFromFilesystem(apiBase, projectSlug, core) {
  const filePath = join(apiBase, "projects", projectSlug, "generations.json");
  core.info(`Reading generations from ${filePath}`);
  const content = await readFile(filePath, "utf-8");
  const { generations } = JSON.parse(content);
  return generations;
}

function _generation(generation) {
  const parts = generation.split(/[.-]/);
  return { major: parseInt(parts[0]), minor: parseInt(parts[1]) };
}

function _date(date) {
  const parts = date.split(/[.-]/);
  return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
}

export { Website };
