import express from "express";
import { createServer } from "http";

/**
 * Creates a stateful mock GitHub REST API server for integration testing.
 *
 * Handles the milestone endpoints used by milestones.js:
 *   GET   /repos/:owner/:repo/milestones
 *   POST  /repos/:owner/:repo/milestones
 *   PATCH /repos/:owner/:repo/milestones/:number
 */
const DEFAULT_RUN = {
	id: 1,
	name: "CI",
	run_number: 1,
	path: "owner/repo/.github/workflows/ci.yml@main",
	display_title: "Test workflow run",
	head_sha: "abc1234567890",
	head_commit: { message: "Test commit" },
	event: "push",
	actor: { login: "test-user", html_url: "https://github.com/test-user" },
	triggering_actor: { login: "test-user", html_url: "https://github.com/test-user" },
	pull_requests: [],
};

const DEFAULT_JOBS = [
	{ id: 1, name: "build", conclusion: "success", html_url: "https://github.com/owner/repo/actions/runs/1/job/1" },
];

function createMockGithubServer(initialMilestones = [], options = {}) {
	let milestones = initialMilestones.map((m) => ({ ...m }));
	let nextNumber =
		milestones.length > 0 ? Math.max(...milestones.map((m) => m.number)) + 1 : 1;
	let contents = new Map();
	const run = options.run ?? DEFAULT_RUN;
	const jobs = options.jobs ?? DEFAULT_JOBS;

	const app = express();
	app.use(express.json());

	app.get("/repos/:owner/:repo/contents/*", (req, res) => {
		const filePath = decodeURIComponent(req.params[0]);
		const stored = contents.get(filePath);
		if (!stored) return res.status(404).json({ message: "Not Found" });
		res.json({ content: stored.content, sha: stored.sha, encoding: "base64" });
	});

	app.put("/repos/:owner/:repo/contents/*", (req, res) => {
		const filePath = decodeURIComponent(req.params[0]);
		const sha = req.body.sha || `sha-${Date.now()}`;
		contents.set(filePath, { content: req.body.content, sha });
		res.status(200).json({ content: { path: filePath, sha } });
	});

	app.get("/repos/:owner/:repo/actions/runs/:run_id", (req, res) => {
		res.json({ ...run, id: parseInt(req.params.run_id) });
	});

	app.get("/repos/:owner/:repo/actions/runs/:run_id/jobs", (req, res) => {
		res.json({ jobs });
	});

	app.get("/repos/:owner/:repo/milestones", (req, res) => {
		const { state = "open" } = req.query;
		const result =
			state === "all" ? [...milestones] : milestones.filter((m) => m.state === state);
		res.json(result);
	});

	app.post("/repos/:owner/:repo/milestones", (req, res) => {
		const milestone = {
			number: nextNumber++,
			title: req.body.title,
			state: "open",
			due_on: req.body.due_on || null,
			description: req.body.description || "",
		};
		milestones.push(milestone);
		res.status(201).json(milestone);
	});

	app.patch("/repos/:owner/:repo/milestones/:number", (req, res) => {
		const idx = milestones.findIndex((m) => m.number === parseInt(req.params.number));
		if (idx === -1) return res.status(404).json({ message: "Not Found" });
		milestones[idx] = { ...milestones[idx], ...req.body };
		res.json(milestones[idx]);
	});

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
		getMilestone(number) {
			return milestones.find((m) => m.number === number);
		},
		getMilestones() {
			return milestones.map((m) => ({ ...m }));
		},
		getContent(filePath) {
			return contents.get(filePath);
		},
		reset(newMilestones = []) {
			milestones = newMilestones.map((m) => ({ ...m }));
			nextNumber =
				milestones.length > 0 ? Math.max(...milestones.map((m) => m.number)) + 1 : 1;
			contents = new Map();
		},
	};
}

// ---------------------------------------------------------------------------
// Standalone mode — for use with local-action manual integration tests.
//
// Usage:
//   node __fixtures__/github-server.js [port]          (default: 3000)
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
	const port = parseInt(process.argv[2]) || 3000;
	const seed = [
		{ number: 1, title: "1.0.0", state: "open", due_on: "2025-01-01T00:00:00Z", description: "" },
		{ number: 2, title: "1.1.0", state: "open", due_on: "2025-06-01T00:00:00Z", description: "" },
	];

	const srv = createMockGithubServer(seed);
	await srv.start(port);
	console.log(`Mock GitHub API server listening on http://localhost:${port}`);

	process.on("SIGINT", async () => {
		await srv.stop();
		process.exit(0);
	});
}

export { createMockGithubServer };
