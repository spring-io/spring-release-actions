import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("compute-next-scheduled-milestone", () => {
  it(
    "computes the next scheduled milestone for a snapshot version",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("OCTOKIT_BASE_URL", "http://localhost:18088");
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(
          __dirname,
          "compute-next-scheduled-milestone.test.yml",
        ),
        bind: true,
      });

      expect(
        steps.some(
          (s) =>
            s.name === "Main Compute next scheduled milestone for snapshot version",
        ),
      ).toBe(true);
      expect(
        steps.some(
          (s) =>
            s.name === "Main Compute next scheduled milestone for dot-x version",
        ),
      ).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
