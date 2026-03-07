import { Act } from "@kie/act-js";
import { createMockGithubServer } from "../__fixtures__/github-server.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("schedule-milestone", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockGithubServer([
      { number: 1, title: "1.0.0", state: "open", due_on: "2025-01-01T00:00:00Z", description: "" },
    ]);
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "creates a new milestone and updates an existing one",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "schedule-milestone.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Create new milestone")).toBe(true);
      expect(steps.some((s) => s.name === "Main Update existing milestone")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const milestones = server.getMilestones();
      expect(milestones.some((m) => m.title === "2.0.0")).toBe(true);
      expect(milestones.find((m) => m.title === "1.0.0")?.due_on).toBe(
        new Date("2025-01-15").toISOString(),
      );
    },
    120_000,
  );
});
