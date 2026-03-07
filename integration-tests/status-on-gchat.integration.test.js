import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../src/status-on-gchat/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const WEBHOOK_URL = "http://test.gchat/webhook";
const RUN_ID = "12345";
const REPOSITORY = "owner/repo";

const mockRun = {
  id: 12345,
  name: "CI",
  run_number: 1,
  path: "owner/repo/.github/workflows/ci.yml@main",
  display_title: "Test commit",
  head_sha: "abc1234567890",
  head_commit: { message: "Test commit" },
  event: "push",
  actor: { login: "test-user", html_url: "https://github.com/test-user" },
  triggering_actor: { login: "test-user", html_url: "https://github.com/test-user" },
  pull_requests: [],
};

const mockJobs = [
  { id: 1, name: "build", conclusion: "success", html_url: "https://github.com/owner/repo/actions/runs/12345/job/1" },
];

const messages = [];

const server = setupServer(
  http.get("https://api.github.com/repos/owner/repo/actions/runs/:run_id", ({ params }) => {
    return HttpResponse.json({ ...mockRun, id: parseInt(params.run_id) });
  }),
  http.get("https://api.github.com/repos/owner/repo/actions/runs/:run_id/jobs", () => {
    return HttpResponse.json({ jobs: mockJobs });
  }),
  http.post(WEBHOOK_URL, async ({ request }) => {
    messages.push(await request.json());
    return HttpResponse.json({ name: "spaces/mock/messages/abc123" });
  }),
);

describe("status-on-gchat integration", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  beforeEach(() => {
    messages.length = 0;
    process.env.GITHUB_RUN_ID = RUN_ID;
    process.env.GITHUB_REPOSITORY = REPOSITORY;
    process.env.GITHUB_SERVER_URL = "https://github.com";
    process.env.GITHUB_REF_NAME = "main";
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    server.resetHandlers();
  });

  it("posts a workflow status message with succeeded text", async () => {
    await run({ token: "test-token", gchatWebhookUrl: WEBHOOK_URL });

    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain("succeeded");
  });
});
