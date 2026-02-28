import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

const mockGetWorkflowRun = jest.fn();
const mockListJobsForWorkflowRun = jest.fn();
const mockOctokit = jest.fn(() => ({
  actions: {
    getWorkflowRun: mockGetWorkflowRun,
    listJobsForWorkflowRun: mockListJobsForWorkflowRun,
  },
}));

const mockAxiosPost = jest.fn();

jest.unstable_mockModule("@actions/core", () => core);
jest.unstable_mockModule("@octokit/rest", () => ({
  Octokit: mockOctokit,
}));
jest.unstable_mockModule("axios", () => ({
  default: { post: mockAxiosPost },
}));

const {
  run,
  computeRunStatus,
  buildRunInfo,
  buildMessage,
} = await import("../../src/status-on-gchat/index.js");

describe("status-on-gchat", () => {
  const defaultInputs = {
    gchatWebhookUrl: "https://webhook.example.com",
    token: "token",
  };

  const defaultRun = {
    id: 12345,
    name: "CI",
    run_number: 42,
    path: "owner/repo/.github/workflows/ci.yml@main",
    display_title: "fix: resolve null pointer",
    head_sha: "abc1234567890",
    head_commit: { message: "fix: resolve null pointer" },
    event: "push",
    actor: { login: "jane", html_url: "https://github.com/jane" },
    triggering_actor: { login: "jane", html_url: "https://github.com/jane" },
    pull_requests: [],
  };

  const defaultJobs = [
    { id: 1, name: "build", conclusion: "success", html_url: "https://github.com/owner/repo/actions/runs/12345/job/1" },
    { id: 2, name: "test", conclusion: "success", html_url: "https://github.com/owner/repo/actions/runs/12345/job/2" },
  ];

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GITHUB_RUN_ID = "12345";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_SERVER_URL = "https://github.com";
    process.env.GITHUB_REF_NAME = "main";
    mockGetWorkflowRun.mockResolvedValue({ data: defaultRun });
    mockListJobsForWorkflowRun.mockResolvedValue({
      data: { jobs: defaultJobs },
    });
    mockAxiosPost.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  describe("run", () => {
    it("fetches run and jobs, sets output result, and posts to webhook", async () => {
      await run(defaultInputs);

      expect(mockGetWorkflowRun).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        run_id: 12345,
      });
      expect(mockListJobsForWorkflowRun).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        run_id: 12345,
      });
      expect(core.setOutput).toHaveBeenCalledWith("result", "succeeded");
      expect(mockAxiosPost).toHaveBeenCalledWith(
        "https://webhook.example.com",
        expect.objectContaining({
          text: expect.stringContaining("succeeded"),
        }),
      );
      expect(mockAxiosPost.mock.calls[0][1].text).toContain(
        "<https://github.com/owner/repo/actions/runs/12345|fix: resolve null pointer> succeeded",
      );
      expect(mockAxiosPost.mock.calls[0][1].text).toContain(
        "Commit <https://github.com/owner/repo/commit/abc1234567890|abc1234> pushed by <https://github.com/jane|jane>",
      );
    });

    it("calls setFailed when GITHUB_RUN_ID is missing", async () => {
      delete process.env.GITHUB_RUN_ID;
      await run(defaultInputs);
      expect(core.setFailed).toHaveBeenCalledWith(
        "GITHUB_RUN_ID and GITHUB_REPOSITORY must be set",
      );
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("calls setFailed when API fails", async () => {
      mockGetWorkflowRun.mockRejectedValue(new Error("API error"));
      await run(defaultInputs);
      expect(core.setFailed).toHaveBeenCalledWith(
        "Failed to fetch run or jobs: API error",
      );
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("calls warning but does not setFailed when webhook POST fails", async () => {
      mockAxiosPost.mockRejectedValue(new Error("Network error"));
      await run(defaultInputs);
      expect(core.setOutput).toHaveBeenCalledWith("result", "succeeded");
      expect(core.warning).toHaveBeenCalledWith(
        "Failed to send Google Chat notification: Network error",
      );
      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });

  describe("computeRunStatus", () => {
    it("returns succeeded when all jobs are success or skipped", () => {
      expect(
        computeRunStatus([
          { conclusion: "success" },
          { conclusion: "skipped" },
        ]),
      ).toBe("succeeded");
    });

    it("returns failed when any job is failure", () => {
      expect(
        computeRunStatus([
          { conclusion: "success" },
          { conclusion: "failure" },
        ]),
      ).toBe("failed");
    });

    it("returns cancelled when any job is cancelled", () => {
      expect(
        computeRunStatus([
          { conclusion: "success" },
          { conclusion: "cancelled" },
        ]),
      ).toBe("cancelled");
    });

    it("returns unsuccessful when no jobs have conclusion", () => {
      expect(computeRunStatus([])).toBe("unsuccessful");
      expect(computeRunStatus([{ name: "build" }])).toBe("unsuccessful");
    });
  });

  describe("buildRunInfo", () => {
    const serverUrl = "https://github.com";
    const repository = "owner/repo";

    it("returns scheduled workflow when no actor", () => {
      expect(
        buildRunInfo(
          { pull_requests: [], triggering_actor: null, actor: null },
          serverUrl,
          repository,
        ),
      ).toBe("Run via scheduled workflow");
    });

    it("returns PR info when pull_requests present", () => {
      const run = {
        pull_requests: [{ number: 100 }],
        triggering_actor: { login: "jane", html_url: "https://github.com/jane" },
      };
      expect(buildRunInfo(run, serverUrl, repository)).toBe(
        "Pull request #<https://github.com/owner/repo/pull/100|100> opened by <https://github.com/jane|jane>",
      );
    });

    it("returns commit info for push event", () => {
      const run = {
        pull_requests: [],
        event: "push",
        head_sha: "abc1234",
        triggering_actor: { login: "jane", html_url: "https://github.com/jane" },
      };
      expect(buildRunInfo(run, serverUrl, repository)).toBe(
        "Commit <https://github.com/owner/repo/commit/abc1234|abc1234> pushed by <https://github.com/jane|jane>",
      );
    });

    it("returns manual run when actor present but not PR or push", () => {
      const run = {
        pull_requests: [],
        event: "workflow_dispatch",
        triggering_actor: { login: "jane", html_url: "https://github.com/jane" },
      };
      expect(buildRunInfo(run, serverUrl, repository)).toBe(
        "Manually run by <https://github.com/jane|jane>",
      );
    });
  });

  describe("buildMessage", () => {
    it("builds message with workflow status, info, run info, and job lines", () => {
      const run = {
        ...defaultRun,
        path: "owner/repo/.github/workflows/ci.yml@main",
      };
      const jobs = [
        { name: "build", conclusion: "failure", html_url: "https://example.com/job/1" },
      ];
      const text = buildMessage(
        run,
        jobs,
        "https://github.com",
        "owner/repo",
        "main",
      );
      expect(text).toContain(
        "<https://github.com/owner/repo/actions/runs/12345|fix: resolve null pointer> failed",
      );
      expect(text).toContain(
        "<https://github.com/owner/repo/actions/workflows/ci.yml?query=branch%3Amain|CI> #42",
      );
      expect(text).toContain("* <https://example.com/job/1|build> was failure");
    });
  });
});
