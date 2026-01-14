const core = require("@actions/core");
const { Inputs } = require("./inputs");
const { Milestones } = require("../milestones");

async function run() {
	const inputs = new Inputs();
	const milestones = new Milestones(inputs.token, inputs.repository);
	try {
		await milestones.scheduleMilestone(
			inputs.version,
			inputs.versionDate,
			inputs.description,
		);
	} catch (error) {
		core.setFailed(error.message);
	}
}

if (require.main === module) {
	run();
}

module.exports = run;
