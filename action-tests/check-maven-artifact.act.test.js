import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("check-maven-artifact", () => {
  it(
    "succeeds when artifact is found in the repository",
    async () => {
      const act = new Act(repoRoot);
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
