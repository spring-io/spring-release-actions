import express from "express";
import { createServer } from "http";

function createMockSpringProjectsServer() {
  let releases = [];

  const app = express();
  app.use(express.json());

  app.get("/projects/:slug/releases", (req, res) => {
    res.json({ _embedded: { releases: [...releases] } });
  });

  app.delete("/projects/:slug/releases/:version", (req, res) => {
    const version = decodeURIComponent(req.params.version);
    releases = releases.filter((r) => r.version !== version);
    res.status(204).send();
  });

  app.post("/projects/:slug/releases", (req, res) => {
    releases.push(req.body);
    res.status(201).json(req.body);
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
      return [...releases];
    },
    reset() {
      releases = [];
    },
  };
}

export { createMockSpringProjectsServer };
