const core = require("@actions/core");

class Inputs {
	constructor() {
		this._gchatWebhookUrl = core.getInput("gchat-webhook-url");
		this._version = core.getInput("version");
		this._versionDate = core.getInput("version-date");
		this._projectName = core.getInput("project-name", { required: false });
	}

	get gchatWebhookUrl() {
		return this._gchatWebhookUrl;
	}

	get version() {
		return this._version;
	}

	get versionDate() {
		return this._versionDate;
	}

	get projectName() {
		return this._projectName || process.env.GITHUB_REPOSITORY.split("/")[1];
	}
}

module.exports = {
	Inputs,
};
