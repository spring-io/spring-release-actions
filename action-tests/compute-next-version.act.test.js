import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("compute-next-version", () => {
  it(
    "computes the next version from a milestone and generation",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", "http://localhost:18083");
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
