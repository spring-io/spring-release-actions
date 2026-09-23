import { vi, beforeEach, afterEach } from "vitest";
import * as core from "../../__fixtures__/core.js";
import { run } from "../../src/compute-release-channel/index.js";

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

function inputs({
  version,
  private: isPrivate,
  repository = "spring-projects/spring-security",
}) {
  return {
    version,
    private: isPrivate,
    repository,
    projectSlug: "spring-security",
    projectsApiBase: undefined,
  };
}

describe("compute-release-channel run", () => {
  beforeEach(() => {
    websiteModule.__getMock.mockReset();
    core.setOutput.mockReset();
    core.setFailed.mockReset();
    core.info.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies a four-digit version in a private repository as hotfix without a generation lookup", async () => {
    await run(inputs({ version: "4.1.1.1", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "hotfix");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("fails for a four-digit version in a public repository, since that's a configuration error", async () => {
    await run(inputs({ version: "4.1.1.1", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("configuration error"),
    );
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("classifies an -INTERNAL-SNAPSHOT version in a private repository as internal without a generation lookup", async () => {
    await run(inputs({ version: "7.2.1-INTERNAL-SNAPSHOT", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("fails for an -INTERNAL-SNAPSHOT version in a public repository, since that's a configuration error", async () => {
    await run(inputs({ version: "7.2.1-INTERNAL-SNAPSHOT", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("configuration error"),
    );
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("classifies a four-digit -INTERNAL-SNAPSHOT version in a private repository as hotfix, since four-digit takes priority", async () => {
    await run(
      inputs({ version: "7.2.1.5-INTERNAL-SNAPSHOT", private: true }),
    );

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "hotfix");
  });

  it("classifies an oss-phase private version as internal", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ version: "7.2.3", private: true }),
      new Date(2026, 5, 15),
    );

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
  });

  it("classifies an oss-phase public version as oss", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ version: "7.1.3", private: false }),
      new Date(2026, 5, 15),
    );

    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
  });

  it("classifies a commercial-phase private version as lts", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ version: "5.7.29", private: true }),
      new Date(2026, 11, 15),
    );

    expect(core.setOutput).toHaveBeenCalledWith("channel", "lts");
  });

  it("errors on a commercial-phase version in a public repository", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ version: "5.7.29", private: false }),
      new Date(2026, 11, 15),
    );

    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("errors on an eol generation regardless of repository visibility", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ version: "5.7.29", private: true }),
      new Date(2027, 5, 1),
    );

    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("falls back to internal when the generation lookup returns null for a private repository", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ version: "5.7.29", private: true }));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("falls back to oss when the generation lookup returns null for a public repository", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ version: "7.1.3", private: false }));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("still performs a real generation lookup for a milestone version, unlike branch-name-only classification", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2020, month: 1, day: 1 },
        commercialEnd: { year: 2021, month: 1, day: 1 },
      }),
    );

    await run(
      inputs({ version: "7.2.0-M1", private: true }),
      new Date(2026, 5, 15),
    );

    expect(websiteModule.__getMock).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalled();
  });

  it("fails when the version can't be parsed", async () => {
    await run(inputs({ version: "not-a-version", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it("fails once with the underlying error message when the API throws", async () => {
    websiteModule.__getMock.mockRejectedValue(
      new Error("Projects API returned 503"),
    );

    await run(inputs({ version: "5.7.29", private: true }));

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith("Projects API returned 503");
    expect(core.setOutput).not.toHaveBeenCalled();
  });
});
