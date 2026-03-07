import express from "express";
import { createServer } from "http";
import { writeFileSync } from "fs";

function createMockSpringProjectsServer({ releases = [], generations = [] } = {}) {
  let _releases = [...releases];

  const app = express();
  app.use(express.json());

  app.get("/_state", (req, res) => {
    res.json({ releases: [..._releases] });
  });

  app.get("/projects/:slug/releases", (req, res) => {
    res.json({ _embedded: { releases: [..._releases] } });
  });

  app.delete("/projects/:slug/releases/:version", (req, res) => {
    const version = decodeURIComponent(req.params.version);
    _releases = _releases.filter((r) => r.version !== version);
    res.status(204).send();
  });

  app.post("/projects/:slug/releases", (req, res) => {
    _releases.push(req.body);
    res.status(201).json(req.body);
  });

  app.get("/projects/:slug/generations", (req, res) => {
    res.json({ _embedded: { generations } });
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
    getReleases() {
      return [..._releases];
    },
    reset() {
      _releases = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Standalone mode — used by the composite action fixture.
//
// Usage:  RELEASES='[...]' GENERATIONS='[...]' PORT=<port> node mock.js
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const releases = JSON.parse(process.env.RELEASES || "[]");
  const generations = JSON.parse(process.env.GENERATIONS || "[]");
  const port = parseInt(process.env.PORT || "0");

  const srv = createMockSpringProjectsServer({ releases, generations });
  const actualPort = await srv.start(port);
  writeFileSync("/tmp/spring-projects-server.port", String(actualPort));
  console.log(`Mock Spring Projects server listening on http://localhost:${actualPort}`);

  process.on("SIGTERM", async () => { await srv.stop(); process.exit(0); });
}

export { createMockSpringProjectsServer };
