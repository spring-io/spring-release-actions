import { createServer } from "http";
import { writeFileSync } from "fs";

function createMockMavenRepoServer(knownVersions = []) {
  const server = createServer((req, res) => {
    if (req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const found = knownVersions.some((v) => req.url.includes(`/${v}/`));
    res.writeHead(found ? 200 : 404).end();
  });

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
  };
}

// ---------------------------------------------------------------------------
// Standalone mode — used by the composite action fixture.
//
// Usage:  KNOWN_VERSIONS='["6.1.0","6.1.1"]' PORT=<port> node mock.js
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const knownVersions = JSON.parse(process.env.KNOWN_VERSIONS || "[]");
  const port = parseInt(process.env.PORT || "0");

  const srv = createMockMavenRepoServer(knownVersions);
  const actualPort = await srv.start(port);
  writeFileSync("/tmp/maven-repo-server.port", String(actualPort));
  console.log(`Mock Maven repo server listening on http://localhost:${actualPort}`);

  process.on("SIGTERM", async () => { await srv.stop(); process.exit(0); });
}

export { createMockMavenRepoServer };
