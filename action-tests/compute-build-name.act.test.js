import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("compute-build-name", () => {
  it(
    "computes build name for snapshot and release versions",
    async () => {
      const act = new Act(repoRoot);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "compute-build-name.test.yml"),
        bind: true,
      });

      expect(
        steps.some((s) => s.name === "Main Compute snapshot build name"),
      ).toBe(true);
      expect(
        steps.some((s) => s.name === "Main Compute release build name"),
      ).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
