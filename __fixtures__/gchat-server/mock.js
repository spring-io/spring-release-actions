import express from "express";
import { createServer } from "http";
import { writeFileSync } from "fs";

function createMockGchatServer() {
  let messages = [];

  const app = express();
  app.use(express.json());

  app.post("/", (req, res) => {
    messages.push(req.body);
    res.status(200).json({ name: "spaces/mock/messages/abc123" });
  });

  app.get("/_state", (req, res) => {
    res.json({ messages: [...messages] });
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

// ---------------------------------------------------------------------------
// Standalone mode — used by the composite action fixture.
//
// Usage:  PORT=<port> node mock.js
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || "0");

  const srv = createMockGchatServer();
  const actualPort = await srv.start(port);
  writeFileSync("/tmp/gchat-server.port", String(actualPort));
  console.log(`Mock GChat server listening on http://localhost:${actualPort}`);

  process.on("SIGTERM", async () => { await srv.stop(); process.exit(0); });
}

export { createMockGchatServer };
