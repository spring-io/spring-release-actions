import { Octokit } from "@octokit/rest";
import { Version } from "./versions.js";
import { compareVersions } from "compare-versions";

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * A class for interacting with GitHub milestones.
 * Specifically, the class checks for a milestone's existence
 * before attempting operations in order to preempt errors
 * from GitHub
 *
 * @author Josh Cummings
 */
class Milestones {
  /**
   * @param token the GH token needed to query milestones
   * @param repo the GH repository, like {@code spring-projects/spring-security} to operate on
   * @param core the {@code @actions/core} instance for logging (optional)
   */
  constructor(token, repo, core = _noOpCore) {
    const baseUrl = process.env.OCTOKIT_BASE_URL;
    this.gh = new Octokit({ auth: token, ...(baseUrl && { baseUrl }) });
    [this.owner, this.repo] = repo.split("/");
    this.milestoneType = this.repo.endsWith("-commercial")
      ? "enterprise"
      : "oss";
    this.core = core;
  }

  /**
   * Find milestone by {@code title} regardless of state
   *
   * @param {string} title
   * @returns {Promise<null | { number: number, name: string, dueDate: Date | null }>}
   */
  async findMilestoneByTitle(title) {
    const milestones = await this.gh.paginate(
      this.gh.rest.issues.listMilestones,
      {
        owner: this.owner,
        repo: this.repo,
        state: "all",
        per_page: 100,
      },
    );

    const m = milestones.find((m) => m.title === title);
    if (!m) {
      return null;
    }

    return {
      number: m.number,
      name: m.title,
      dueDate: m.due_on ? new Date(m.due_on) : null,
      type: this.milestoneType,
    };
  }

  async findNextOpenMilestoneForGeneration(generation) {
    const milestones = await this.gh.paginate(
      this.gh.rest.issues.listMilestones,
      {
        owner: this.owner,
        repo: this.repo,
        state: "open",
        per_page: 100,
      },
    );

    this.core.info(
      `Looking for next milestone for generation ${generation.major}.${generation.minor}`,
    );
    this.core.debug(`Found ${milestones.length} open milestones`);

    const filtered = milestones
      .filter((m) => {
        const [major, minor] = m.title.split(".");
        return (
          generation.major === parseInt(major) &&
          generation.minor === parseInt(minor)
        );
      })
      .filter((m) => m.due_on && _isOnOrAfterToday(new Date(m.due_on)))
      .sort((a, b) => {
        const dateDiff = new Date(a.due_on) - new Date(b.due_on);
        return dateDiff !== 0 ? dateDiff : compareVersions(a.title, b.title);
      });
    if (filtered.length === 0) {
      this.core.info("No upcoming open milestones");
      return null;
    }

    const m = filtered[0];
    return {
      number: m.number,
      name: m.title,
      dueDate: m.due_on ? new Date(m.due_on) : null,
      type: this.milestoneType,
    };
  }

  /**
   * Close a milestone, if it exists
   * @param title the milestone title
   * @returns {Promise<void>}
   */
  async closeMilestone(title) {
    const milestone = await this.findMilestoneByTitle(title);
    if (milestone) {
      this.core.info(`Closing milestone ${title}`);
      await this.gh.rest.issues.updateMilestone({
        owner: this.owner,
        repo: this.repo,
        milestone_number: milestone.number,
        state: "closed",
      });
      this.core.info(`Closed milestone ${title}`);
    } else {
      this.core.info(`Milestone ${title} not found; nothing to close`);
    }
  }

  /**
   * Schedule a milestone or update the existing one
   * @param title the milestone title
   * @param date the milestone due date
   * @param description the milestone description
   * @returns {Promise<void>}
   */
  async scheduleMilestone(title, date, description) {
    const milestone = await this.findMilestoneByTitle(title);
    const dueDate = new Date(date).toISOString();
    if (milestone) {
      this.core.info(`Updating milestone ${title} to due ${date}`);
      await this.gh.rest.issues.updateMilestone({
        owner: this.owner,
        repo: this.repo,
        milestone_number: milestone.number,
        due_on: dueDate,
        description: description,
      });
      this.core.info(`Updated milestone ${title}`);
    } else {
      this.core.info(`Creating milestone ${title} due ${date}`);
      await this.gh.rest.issues.createMilestone({
        owner: this.owner,
        repo: this.repo,
        title: title,
        due_on: dueDate,
        description: description,
      });
      this.core.info(`Created milestone ${title}`);
    }
  }
}

function _isOnOrAfterToday(dueDate) {
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
  return dueDateNorm >= todayNorm;
}

export { Milestones };
