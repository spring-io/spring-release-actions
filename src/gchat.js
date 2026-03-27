import axios from "axios";

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * A class for announcing completed and planned milestones
 * @author Josh Cummings
 */
class Announce {
  constructor(announcementUrl, projectName, core = _noOpCore) {
    this.announcementUrl = announcementUrl;
    this.projectName = projectName;
    this.core = core;
  }

  /**
   * Announce a completed release
   * @param milestoneTitle the milestone released, like {@code 1.2.3}
   * @returns {Promise<void>}
   */
  async announceRelease(milestoneTitle) {
    this.core.info(
      `Announcing release ${milestoneTitle} for ${this.projectName}`,
    );
    const text = `${this.projectName}-announcing \`${milestoneTitle}\``;
    await axios.post(this.announcementUrl, { text });
  }

  /**
   * Announce a planned release
   * @param milestoneTitle the milestone planned, like {@code 1.2.4}
   * @param milestoneDate the date the milestone is planned for, like {@code 2026-01-02}
   * @returns {Promise<void>}
   */
  async planRelease(milestoneTitle, milestoneDate) {
    this.core.info(
      `Planning release ${milestoneTitle} on ${milestoneDate} for ${this.projectName}`,
    );
    const text = `${this.projectName}-planning \`${milestoneTitle}\` on ${milestoneDate}`;
    await axios.post(this.announcementUrl, { text });
  }
}

export { Announce };
