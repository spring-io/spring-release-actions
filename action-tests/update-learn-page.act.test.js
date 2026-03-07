import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("update-learn-page", () => {
  it(
    "creates a documentation file and then updates it",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", "http://localhost:18084");
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "update-learn-page.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Create documentation file")).toBe(true);
      expect(steps.some((s) => s.name === "Main Update documentation file")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
