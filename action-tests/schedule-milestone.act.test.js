import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("schedule-milestone", () => {
  it(
    "creates a new milestone and updates an existing one",
    async () => {
      const act = new Act(repoRoot);
      act.setSecret("GITHUB_TOKEN", "test-token");
      act.setEnv("GITHUB_API_URL", "http://localhost:18081");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "schedule-milestone.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Create new milestone")).toBe(true);
      expect(steps.some((s) => s.name === "Main Update existing milestone")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
