const core = require("@actions/core");

const { Inputs } = require("./inputs");
const { Version } = require("../versions");

const inputs = new Inputs();

async function run() {
	const version = new Version(inputs.version);
	const next = version.nextSnapshot();
	core.setOutput("version", next.version);
}

if (require.main === module) {
	run();
}

module.exports = {
	run,
};
