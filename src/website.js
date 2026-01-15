import { Octokit } from "@octokit/rest";
import { Base64 } from "js-base64";
import { getWeekOfMonthAndDayOfWeek } from "./lib.js";

/**
 * Class for interacting with material in {@code spring-website-content}
 *
 * @author Josh Cummings
 */
class Website {
  constructor(inputs) {
    this.gh = new Octokit({ auth: inputs.websiteToken });
    this.owner = inputs.websiteRepository.split("/")[0];
    this.repo = inputs.websiteRepository.split("/")[1];
    this.projectSlug = inputs.projectSlug;
  }

  /**
   * Look up generate data using the major and minor version numbers in
   * the supplied {@linkcode Version}.
   * @param version
   * @returns {Promise<{generation: {major: number, minor: number}, dayOfWeek: *, weekOfMonth: number, oss: {frequency: number, offset: number, end: {year: number, month: number}}, enterprise: {frequency: number, offset: number, end: {year: number, month: number}}}|null>}
   */
  async getGenerationByVersion(version) {
    const file = await _load(
      this.gh,
      this.owner,
      this.repo,
      `/project/${this.projectSlug}/generations.json`,
    );
    const asStrings = JSON.parse(file);
    const { dayOfWeek, weekOfMonth } = getWeekOfMonthAndDayOfWeek(
      version.dueDate,
    );
    for (const generation of asStrings.generations) {
      console.log(
        `Checking generation ${generation.generation} against ${version.major}.${version.minor}`,
      );
      const majorMinor = _generation(generation.generation);
      if (version.isSameMajorMinor(majorMinor)) {
        return {
          major: majorMinor.major,
          minor: majorMinor.minor,
          dayOfWeek,
          weekOfMonth,
          oss: {
            frequency: 1,
            offset: 0,
            end: _date(generation.ossSupportEnd),
          },
          enterprise: {
            frequency: 3,
            offset: 1,
            end: _date(generation.enterpriseSupportEnd),
          },
        };
      }
    }
    return null;
  }
}

async function _load(gh, owner, repo, path, ref = "main") {
  try {
    console.log(`Retrieving ${path} from ${owner}/${repo}@${ref}`);
    const response = await gh.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // The content is returned in base64 encoding
    const encodedContent = response.data.content;
    return Base64.decode(encodedContent);
  } catch (error) {
    console.error("Error retrieving file content:", error);
    throw error;
  }
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
