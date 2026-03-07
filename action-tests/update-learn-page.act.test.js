import { Act } from "@kie/act-js";
import { createMockGithubServer } from "../__fixtures__/github-server/mock.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("update-learn-page", () => {
  let server;
  let port;

  beforeAll(async () => {
    server = createMockGithubServer();
    port = await server.start();
  }, 10_000);

  afterAll(() => server.stop());

  it(
    "creates a documentation file and then updates it",
    async () => {
      const act = new Act(repoRoot);
      act.setEnv("GITHUB_API_URL", `http://localhost:${port}`);
      act.setSecret("GITHUB_TOKEN", "test-token");

      const steps = await act.runEvent("push", {
        workflowFile: path.join(__dirname, "update-learn-page.test.yml"),
        bind: true,
      });

      expect(steps.some((s) => s.name === "Main Create documentation file")).toBe(true);
      expect(steps.some((s) => s.name === "Main Update documentation file")).toBe(true);
      expect(steps.filter((s) => s.status === 1)).toHaveLength(0);

      const stored = server.getContent("project/spring-boot/documentation.json");
      const entries = JSON.parse(Buffer.from(stored.content, "base64").toString());
      // After step 2 (version 1.2.4), same-generation entries (1.2.3, 1.2.4-SNAPSHOT) are
      // replaced with the new GA and its snapshot
      expect(entries.some((e) => e.version === "1.2.4")).toBe(true);
      expect(entries.some((e) => e.version === "1.2.5-SNAPSHOT")).toBe(true);
      expect(entries.some((e) => e.version === "1.2.3")).toBe(false);
    },
    120_000,
  );
});
