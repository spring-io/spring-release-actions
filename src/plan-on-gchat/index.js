const core = require("@actions/core");
const { Inputs } = require("./inputs");
const { Announce } = require("../gchat");

async function run() {
	const inputs = new Inputs();
	const announce = new Announce(inputs.gchatWebhookUrl, inputs.projectName);
	try {
		await announce.planRelease(inputs.version, inputs.versionDate);
	} catch (error) {
		core.setFailed(error.message);
	}
}

if (require.main === module) {
	run();
}

module.exports = { run };
