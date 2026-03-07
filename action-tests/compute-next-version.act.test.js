import { Act } from "@kie/act-js";
import { createMockGithubServer } from "../__fixtures__/github-server/mock.js";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function createMockProjectsApiServer() {
  const app = express();
  app.get("/projects/:slug/generations", (req, res) => {
    res.json({
      _embedded: {
        generations: [
          {
            name: "1.0",
            ossSupportEndDate: "2028-01",
            commercialSupportEndDate: "2031-01",
          },
        ],
      },
    });
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
  };
}

describe("compute-next-version", () => {
  let githubServer;
  let projectsServer;
  let githubPort;
  let projectsPort;

  beforeAll(async () => {
    githubServer = createMockGithubServer([
      {
        number: 1,
        title: "1.0.0",
        state: "open",
        due_on: "2025-05-21T00:00:00Z",
        description: "",
      },
    ]);
    projectsServer = createMockProjectsApiServer();
    [githubPort, projectsPort] = await Promise.all([
      githubServer.start(),
      projectsServer.start(),
    ]);
  }, 10_000);

  afterAll(() =>
    Promise.all([githubServer.stop(), projectsServer.stop()]),
  );

  it(
    "computes the next version from a milestone and generation",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", `http://localhost:${githubPort}`);
      act.setEnv("PROJECTS_API_URL", `http://localhost:${projectsPort}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "compute-next-version.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Compute next version")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
