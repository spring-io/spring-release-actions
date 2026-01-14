const core = require("@actions/core");

class Inputs {
	constructor() {
		this._version = core.getInput("version", { required: true });
	}

	get version() {
		return this._version;
	}
}

module.exports = {
	Inputs,
};
