import { Act } from "@kie/act-js";
import { createMockGchatServer } from "../__fixtures__/gchat-server/mock.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("plan-on-gchat", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockGchatServer();
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "posts a release plan to the webhook",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GCHAT_WEBHOOK_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "plan-on-gchat.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Plan release")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const messages = server.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe("spring-boot-planning `1.2.4` on 2025-06-01");
    },
    120_000,
  );
});
