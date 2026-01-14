const axios = require("axios");

/**
 * A class for announcing completed and planned milestones
 * @author Josh Cummings
 */
class Announce {
	constructor(announcementUrl, projectName) {
		this.announcementUrl = announcementUrl;
		this.projectName = projectName;
	}

	/**
	 * Announce a completed release
	 * @param milestoneTitle the milestone released, like {@code 1.2.3}
	 * @returns {Promise<void>}
	 */
	async announceRelease(milestoneTitle) {
		const text = `${this.projectName}-announcing \`${milestoneTitle}\` is available now`;
		await axios.post(this.announcementUrl, { text });
	}

	/**
	 * Announce a planned release
	 * @param milestoneTitle the milestone planned, like {@code 1.2.4}
	 * @param milestoneDate the date the milestone is planned for, like {@code 2026-01-02}
	 * @returns {Promise<void>}
	 */
	async planRelease(milestoneTitle, milestoneDate) {
		const text = `${this.projectName}-planning \`${milestoneTitle}\` on ${milestoneDate}`;
		await axios.post(this.announcementUrl, { text });
	}
}

module.exports = { Announce };
