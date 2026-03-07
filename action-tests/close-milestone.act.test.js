import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("close-milestone", () => {
  it(
    "closes existing milestone and skips non-existent milestone",
    async () => {
      const act = new Act(repoRoot);
      act.setSecret("GITHUB_TOKEN", "test-token");
      act.setEnv("GITHUB_API_URL", "http://localhost:18080");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "close-milestone.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Close existing milestone")).toBe(true);
      expect(steps.some((s) => s.name === "Main Close non-existent milestone")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
