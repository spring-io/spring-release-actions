import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../src/plan-on-gchat/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const WEBHOOK_URL = "http://test.gchat/webhook";

const messages = [];

const server = setupServer(
  http.post(WEBHOOK_URL, async ({ request }) => {
    messages.push(await request.json());
    return HttpResponse.json({ name: "spaces/mock/messages/abc123" });
  }),
);

describe("plan-on-gchat integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  beforeEach(() => { messages.length = 0; });
  afterEach(() => server.resetHandlers());

  it("posts a release plan with the correct text", async () => {
    await run({ gchatWebhookUrl: WEBHOOK_URL, version: "1.2.4", versionDate: "2025-06-01", projectName: "spring-boot" });

    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("spring-boot-planning `1.2.4` on 2025-06-01");
  });
});
