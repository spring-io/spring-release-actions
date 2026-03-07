import { Act } from "@kie/act-js";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function createMockMavenServer(knownVersions) {
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

describe("check-maven-artifact", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockMavenServer(["6.1.0"]);
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "succeeds when artifact is found in the repository",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("MAVEN_REPO_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "check-maven-artifact.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Check artifact exists")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
