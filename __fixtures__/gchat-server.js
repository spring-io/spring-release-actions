import express from "express";
import { createServer } from "http";

/**
 * Creates a stateful mock Google Chat webhook server for integration testing.
 *
 * Accepts POST requests at / and records each message body.
 */
function createMockGchatServer() {
	let messages = [];

	const app = express();
	app.use(express.json());

	app.post("/", (req, res) => {
		messages.push(req.body);
		res.status(200).json({ name: "spaces/mock/messages/abc123" });
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
		getMessages() {
			return [...messages];
		},
		reset() {
			messages = [];
		},
	};
}

export { createMockGchatServer };
