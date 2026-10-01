import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("propose-release-blog-post", () => {
  it(
    "opens a pull request proposing a blog post and reuses it on a second run",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("OCTOKIT_BASE_URL", "http://localhost:18085");
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "propose-release-blog-post.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Propose blog post")).toBe(true);
      expect(steps.some((s) => s.name === "Main Propose blog post again")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
