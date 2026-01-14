const core = require("@actions/core");

const { Inputs } = require("./inputs");
const { Milestones } = require("../milestones");
const { Version } = require("../versions");

const inputs = new Inputs();
const milestones = new Milestones(
	inputs.milestoneToken,
	inputs.milestoneRepository,
);

async function run() {
	const version = new Version(inputs.version);
	if (!version.snapshot) {
		core.setOutput("release-version", "");
		return;
	}
	const milestone = milestones.findOpenMilestoneDueTodayForGeneration({
		major: version.major,
		minor: version.minor,
	});
	if (!milestone) {
		core.setOutput("release-version", "");
		return;
	}
	console.log(`Today's release version is ${milestone.name}`);
	core.setOutput("release-version", milestone.name);
}

if (require.main === module) {
	run();
}

module.exports = {
	run,
};
