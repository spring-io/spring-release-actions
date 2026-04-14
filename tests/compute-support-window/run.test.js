import { vi, beforeEach, afterEach } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { run } from "../../src/compute-support-window/index.js";

vi.mock(
  "@actions/core",
  async () => await import("../../__fixtures__/core.js"),
);

vi.mock("../../src/website.js", () => {
  const getGenerationByVersion = vi.fn();
  class Website {
    constructor() {
      this.getGenerationByVersion = getGenerationByVersion;
    }
  }
  return { Website, __getMock: getGenerationByVersion };
});

import * as websiteModule from "../../src/website.js";

const generation = ({ ossEnd, commercialEnd }) => ({
  major: 6,
  minor: 4,
  dayOfWeek: 1,
  weekOfMonth: 3,
  oss: { frequency: 1, offset: 0, end: ossEnd },
  enterprise: { frequency: 3, offset: 1, end: commercialEnd },
});

function inputs({ version = "", refName = "" } = {}) {
  return {
    version,
    refName,
    repository: "spring-projects/spring-security",
    projectSlug: "spring-security",
    projectsApiBase: undefined,
  };
}

describe("compute-support-window run", () => {
  beforeEach(() => {
    websiteModule.__getMock.mockReset();
    core.setOutput.mockReset();
    core.setFailed.mockReset();
    core.info.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns oss when today is on or before the OSS end month", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11 },
        commercialEnd: { year: 2027, month: 2 },
      }),
    );

    await run(inputs({ version: "6.4.16-SNAPSHOT" }), new Date(2026, 5, 15));

    expect(core.setOutput).toHaveBeenCalledWith("support-type", "oss");
    expect(core.setOutput).toHaveBeenCalledWith("oss-end", "2026-11");
    expect(core.setOutput).toHaveBeenCalledWith("commercial-end", "2027-02");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("returns commercial when OSS has ended but commercial has not", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11 },
        commercialEnd: { year: 2027, month: 2 },
      }),
    );

    await run(inputs({ refName: "6.4.x" }), new Date(2026, 11, 15));

    expect(core.setOutput).toHaveBeenCalledWith("support-type", "commercial");
  });

  it("returns eol when both windows have ended", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11 },
        commercialEnd: { year: 2027, month: 2 },
      }),
    );

    await run(inputs({ refName: "6.4.x" }), new Date(2027, 5, 1));

    expect(core.setOutput).toHaveBeenCalledWith("support-type", "eol");
  });

  it("treats the OSS end month itself as still in the OSS window", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11 },
        commercialEnd: { year: 2027, month: 2 },
      }),
    );

    await run(inputs({ refName: "6.4.x" }), new Date(2026, 10, 30));

    expect(core.setOutput).toHaveBeenCalledWith("support-type", "oss");
  });

  it("parses major.minor from a refs/heads ref-name", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11 },
        commercialEnd: { year: 2027, month: 2 },
      }),
    );

    await run(inputs({ refName: "refs/heads/6.4.x" }), new Date(2026, 5, 1));

    const passed = websiteModule.__getMock.mock.calls[0][0];
    expect(passed.major).toBe(6);
    expect(passed.minor).toBe(4);
    expect(core.setOutput).toHaveBeenCalledWith("support-type", "oss");
  });

  it("fails when the ref-name has no parseable major.minor", async () => {
    await run(inputs({ refName: "main" }));

    expect(core.setFailed).toHaveBeenCalled();
    expect(websiteModule.__getMock).not.toHaveBeenCalled();
  });

  it("fails when the generation lookup returns null", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ refName: "6.4.x" }));

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("Could not find generation"),
    );
  });
});
