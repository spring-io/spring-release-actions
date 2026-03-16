import express from "express";
import { createServer } from "http";
import { writeFileSync } from "fs";

/**
 * Creates a stateful mock JFrog Artifactory lifecycle server for integration testing.
 *
 * Handles the endpoints used by release-bundle.js:
 *   POST /lifecycle/api/v2/release_bundle
 *   POST /lifecycle/api/v2/distribution/distribute/:bundleName/:version
 */
function createMockArtifactoryServer() {
	let bundles = [];
	let distributions = [];

	const app = express();
	app.use(express.json());

	app.get("/_state", (req, res) => {
		res.json({ bundles: [...bundles], distributions: [...distributions] });
	});

	app.post("/lifecycle/api/v2/release_bundle", (req, res) => {
		const { release_bundle_name, release_bundle_version } = req.body;
		bundles.push({ name: release_bundle_name, version: release_bundle_version });
		res.status(200).json({ release_bundle_name, release_bundle_version });
	});

	app.post(
		"/lifecycle/api/v2/distribution/distribute/:bundleName/:version",
		(req, res) => {
			const { bundleName, version } = req.params;
			distributions.push({ bundleName, version });
			res.status(200).json({ bundleName, version });
		},
	);

	const server = createServer(app);

	return {
		start(port = 0) {
			return new Promise((resolve) =>
				server.listen(port, "localhost", () => resolve(server.address().port)),
			);
		},
		stop() {
			return new Promise((resolve, reject) =>
				server.close((err) => (err ? reject(err) : resolve())),
			);
		},
		getBundles() {
			return [...bundles];
		},
		getDistributions() {
			return [...distributions];
		},
		reset() {
			bundles = [];
			distributions = [];
		},
	};
}

// ---------------------------------------------------------------------------
// Standalone mode — used by the composite action fixture.
//
// Usage:  PORT=<port> node mock.js
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
	const port = parseInt(process.env.PORT || "0");

	const srv = createMockArtifactoryServer();
	const actualPort = await srv.start(port);
	writeFileSync("/tmp/artifactory-server.port", String(actualPort));
	console.log(
		`Mock Artifactory server listening on http://localhost:${actualPort}`,
	);

	process.on("SIGTERM", async () => {
		await srv.stop();
		process.exit(0);
	});
}

export { createMockArtifactoryServer };
