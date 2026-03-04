import { Act } from "@kie/act-js";
import { createMockGithubServer } from "../__fixtures__/github-server.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("close-milestone", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockGithubServer([
      { number: 1, title: "1.0.0", state: "open", due_on: null, description: "" },
    ]);
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "closes existing milestone and skips non-existent milestone",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "close-milestone.test.yml"),
        bind: true,
      });

      // act-js's OutputParser stores step start (parseRun) and step result
      // (parseSuccess/parseFailure) under different keys when success lines
      // include a timestamp like [153ms]. Verify steps ran and none failed.
      expect(steps.some((s) => s.name === "Main Close existing milestone")).toBe(true);
      expect(steps.some((s) => s.name === "Main Close non-existent milestone")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
    },
    120_000,
  );
});
