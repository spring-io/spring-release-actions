const core = require("@actions/core");

class Inputs {
	constructor() {
		this._version = core.getInput("version", { required: true });
		this._token = core.getInput("token") || process.env.GITHUB_TOKEN;
		this._repository =
			core.getInput("repository") || process.env.GITHUB_REPOSITORY;
	}

	get version() {
		return this._version;
	}

	get token() {
		return this._token;
	}

	get repository() {
		return this._repository;
	}
}

module.exports = {
	Inputs,
};
