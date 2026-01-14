const core = require("@actions/core");

class Inputs {
	constructor() {
		this._version = core.getInput("snapshot-version", { required: true });
		this._milestoneRepository =
			core.getInput("milestone-repository") || process.env.GITHUB_REPOSITORY;
		this._milestoneToken =
			core.getInput("milestone-token") || process.env.GITHUB_TOKEN;
	}

	get version() {
		return this._version;
	}

	get milestoneRepository() {
		return this._milestoneRepository;
	}

	get milestoneToken() {
		return this._milestoneToken;
	}
}

module.exports = {
	Inputs,
};
