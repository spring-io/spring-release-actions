import { Act } from "@kie/act-js";
import { createMockSpringProjectsServer } from "../__fixtures__/spring-projects-server/mock.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("update-learn-page (API strategy)", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockSpringProjectsServer();
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "creates releases and then replaces same-generation entries on update",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_TOKEN", "test-token");
      act.setEnv("PROJECTS_API_BASE", `http://localhost:${port}`);

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "update-learn-page-api.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Create releases")).toBe(true);
      expect(steps.some((s) => s.name === "Main Update releases")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const releases = server.getReleases();
      // After step 2 (version 1.2.4), same-generation entries (1.2.3, 1.2.4-SNAPSHOT)
      // are deleted and replaced with 1.2.4 and 1.2.5-SNAPSHOT
      expect(releases.some((r) => r.version === "1.2.4")).toBe(true);
      expect(releases.some((r) => r.version === "1.2.5-SNAPSHOT")).toBe(true);
      expect(releases.some((r) => r.version === "1.2.3")).toBe(false);
    },
    120_000,
  );
});
