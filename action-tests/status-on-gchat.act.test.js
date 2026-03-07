import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("status-on-gchat", () => {
  it(
    "posts a workflow status message to the webhook",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", "http://localhost:18082");
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "status-on-gchat.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Send workflow status")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
