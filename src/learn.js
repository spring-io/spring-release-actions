const { compareVersions } = require("compare-versions");
const { Version } = require("./versions");

class Entry {
	constructor(version, isAntora, referenceDocUrl, apiDocUrl, current = false) {
		this.version = version;
		this.isAntora = isAntora;
		this.referenceDocUrl = referenceDocUrl;
		this.apiDocUrl = apiDocUrl;
		this.current = current;
	}

	get status() {
		if (this.version.ga) {
			return "GENERAL_AVAILABILITY";
		}
		if (this.version.prerelease) {
			return "PRERELEASE";
		}
		return "SNAPSHOT";
	}

	toJSON() {
		return {
			version: this.version.version,
			isAntora: this.isAntora,
			referenceDocUrl: this.referenceDocUrl,
			apiDocUrl: this.apiDocUrl,
			status: this.status,
			current: this.current,
		};
	}
}

class LearnPage {
	constructor(jsonContent = "[]") {
		this._entries = JSON.parse(jsonContent).map((entry) => {
			const version = new Version(entry.version);
			return new Entry(
				version,
				entry.isAntora,
				entry.referenceDocUrl,
				entry.apiDocUrl,
				entry.current,
			);
		});
	}

	get entries() {
		return this._entries;
	}

	set entries(entries) {
		this._entries = entries;
		this._sortAndMarkCurrent();
	}

	_sortAndMarkCurrent() {
		this._entries.sort((a, b) =>
			compareVersions(b.version.version, a.version.version),
		);
		let foundCurrent = false;
		for (const entry of this._entries) {
			if (entry.status === "GENERAL_AVAILABILITY" && !foundCurrent) {
				entry.current = true;
				foundCurrent = true;
			} else {
				entry.current = false;
			}
		}
	}

	toString() {
		return JSON.stringify(this._entries, null, 2) + "\n";
	}
}

module.exports = {
	Entry,
	LearnPage,
};
