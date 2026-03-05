import { vi } from 'vitest';
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as core from '../__fixtures__/core.js';
import { run } from '../src/close-milestone/index.js';

vi.mock('@actions/core', async () => await import('../__fixtures__/core.js'));

const milestones = [];

const server = setupServer(
  http.get(
    "https://api.github.com/repos/:owner/:repo/milestones",
    ({ request }) => {
      const state = new URL(request.url).searchParams.get("state") || "open";
      const result =
        state === "all"
          ? [...milestones]
          : milestones.filter((m) => m.state === state);
      return HttpResponse.json(result);
    },
  ),
  http.patch(
    "https://api.github.com/repos/:owner/:repo/milestones/:number",
    async ({ request, params }) => {
      const body = await request.json();
      const milestone = milestones.find(
        (m) => m.number === parseInt(params.number),
      );
      if (!milestone) {
        return new HttpResponse(null, { status: 404 });
      }
      Object.assign(milestone, body);
      return HttpResponse.json(milestone);
    },
  ),
);

describe("close-milestone integration", () => {
  const initialMilestones = [
    { number: 1, title: "1.0.0", state: "open", due_on: null, description: "" },
    { number: 2, title: "1.1.0", state: "open", due_on: null, description: "" },
  ];

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => server.close());

  beforeEach(() => {
    milestones.length = 0;
    milestones.push(...initialMilestones.map((m) => ({ ...m })));
  });

  afterEach(() => server.resetHandlers());

  it("closes an existing milestone", async () => {
    await run({ version: "1.0.0", repository: "owner/repo", token: "test-token" });

    expect(milestones.find((m) => m.number === 1).state).toBe("closed");
  });

  it("leaves other milestones open when one is closed", async () => {
    await run({ version: "1.0.0", repository: "owner/repo", token: "test-token" });

    expect(milestones.find((m) => m.number === 2).state).toBe("open");
  });

  it("does nothing when the milestone does not exist", async () => {
    await run({ version: "9.9.9", repository: "owner/repo", token: "test-token" });

    expect(milestones.find((m) => m.number === 1).state).toBe("open");
    expect(milestones.find((m) => m.number === 2).state).toBe("open");
  });
});
