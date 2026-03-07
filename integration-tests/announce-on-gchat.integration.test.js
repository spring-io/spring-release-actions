import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { run } from "../src/announce-on-gchat/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const WEBHOOK_URL = "http://test.gchat/webhook";

const messages = [];

const server = setupServer(
  http.post(WEBHOOK_URL, async ({ request }) => {
    messages.push(await request.json());
    return HttpResponse.json({ name: "spaces/mock/messages/abc123" });
  }),
);

describe("announce-on-gchat integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  beforeEach(() => { messages.length = 0; });
  afterEach(() => server.resetHandlers());

  it("posts a release announcement with the correct text", async () => {
    await run({ gchatWebhookUrl: WEBHOOK_URL, version: "1.2.3", projectName: "spring-boot" });

    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("spring-boot-announcing `1.2.3`");
  });
});
