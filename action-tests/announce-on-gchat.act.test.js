import { Act } from "@kie/act-js";
import { createMockGchatServer } from "../__fixtures__/gchat-server.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("announce-on-gchat", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockGchatServer();
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "posts a release announcement to the webhook",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GCHAT_WEBHOOK_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "announce-on-gchat.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Announce release")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const messages = server.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe("spring-boot-announcing `1.2.3`");
    },
    120_000,
  );
});
