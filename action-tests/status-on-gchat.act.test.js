import { Act } from "@kie/act-js";
import { createMockGchatServer } from "../__fixtures__/gchat-server.js";
import { createMockGithubServer } from "../__fixtures__/github-server/mock.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("status-on-gchat", () => {
  let gchatServer;
  let githubServer;
  let gchatPort;
  let githubPort;

  beforeAll(async () => {
    gchatServer = createMockGchatServer();
    githubServer = createMockGithubServer();
    [gchatPort, githubPort] = await Promise.all([
      gchatServer.start(),
      githubServer.start(),
    ]);
  }, 10_000);

  afterAll(() =>
    Promise.all([gchatServer.stop(), githubServer.stop()]),
  );

  it(
    "posts a workflow status message to the webhook",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GCHAT_WEBHOOK_URL", `http://localhost:${gchatPort}`);
      act.setEnv("GITHUB_API_URL", `http://localhost:${githubPort}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "status-on-gchat.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Send workflow status")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const messages = gchatServer.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toContain("succeeded");
    },
    120_000,
  );
});
