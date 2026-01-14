const { Octokit } = require("@octokit/rest");
const { Version } = require("./versions");
const { compareVersions } = require("compare-versions");

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
	 */
	constructor(token, repo) {
		this.gh = new Octokit({ auth: token });
		this.owner = repo.split("/")[0];
		this.repo = repo.split("/")[1];
		this.milestoneType = this.repo.endsWith("-commercial") ? "enterprise" : "oss";
	}

	/**
	 * Find milestone by {@code title} regardless of state
	 *
	 * @param {string} title
	 * @returns {Promise<null | { number: number, name: string, dueDate: Date | null }>}
	 */
	async findMilestoneByTitle(title) {
		const { data: milestones } = await this.gh.rest.issues.listMilestones({
			owner: this.owner,
			repo: this.repo,
			state: "all",
			per_page: 100,
		});

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

	async findOpenMilestoneDueTodayForGeneration(generation) {
		const { data: milestones } = await this.gh.rest.issues.listMilestones({
			owner: this.owner,
			repo: this.repo,
			state: "open",
			per_page: 100,
		});

		const filtered = milestones
			.filter((m) => {
				const [major, minor, rest] = m.title.split("\.");
				return (
					generation.major === parseInt(major) &&
					generation.minor === parseInt(minor)
				);
			})
			.filter((m) => _isToday(new Date(m.due_on)))
			.sort((a, b) => compareVersions(a.title, b.title));
		if (!filtered || !filtered.length) {
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
			await this.gh.rest.issues.updateMilestone({
				owner: this.owner,
				repo: this.repo,
				milestone_number: milestone.number,
				state: "closed",
			});
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
			await this.gh.rest.issues.updateMilestone({
				owner: this.owner,
				repo: this.repo,
				milestone_number: milestone.number,
				due_on: dueDate,
				description: description,
			});
		} else {
			await this.gh.rest.issues.createMilestone({
				owner: this.owner,
				repo: this.repo,
				title: title,
				due_on: dueDate,
				description: description,
			});
		}
	}
}

function _isToday(dueDate) {
	const today = new Date();
	return (
		dueDate.getDate() === today.getDate() &&
		dueDate.getMonth() === today.getMonth() &&
		dueDate.getFullYear() === today.getFullYear()
	);
}

module.exports = {
	Milestones,
};
