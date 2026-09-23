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
  ref,
  version,
  private: isPrivate,
  repository = "spring-projects/spring-security",
}) {
  return {
    ref,
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

  it("classifies a hotfix-line branch as hotfix without a generation lookup", async () => {
    await run(inputs({ ref: "4.1.1.x", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "hotfix");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("classifies a four-digit release branch as hotfix", async () => {
    await run(inputs({ ref: "release/4.1.1.1", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "hotfix");
  });

  it("classifies an oss-phase private generation branch as internal", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(inputs({ ref: "7.2.x", private: true }), new Date(2026, 5, 15));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
  });

  it("classifies an oss-phase public generation branch as oss", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(inputs({ ref: "7.1.x", private: false }), new Date(2026, 5, 15));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
  });

  it("classifies a commercial-phase private generation branch as lts", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(inputs({ ref: "5.7.x", private: true }), new Date(2026, 11, 15));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "lts");
  });

  it("errors on a commercial-phase generation in a public repository", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(inputs({ ref: "5.7.x", private: false }), new Date(2026, 11, 15));

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

    await run(inputs({ ref: "5.7.x", private: true }), new Date(2027, 5, 1));

    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("classifies an unresolved private ref as internal without a generation lookup", async () => {
    await run(inputs({ ref: "main", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("classifies an unresolved public ref as oss without a generation lookup", async () => {
    await run(inputs({ ref: "main", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
  });

  it("falls back to the version input when the ref doesn't resolve", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ ref: "main", version: "6.4.16-SNAPSHOT", private: true }),
      new Date(2026, 5, 15),
    );

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
  });

  it("classifies a milestone release branch as internal without a generation lookup, even if the calendar would say otherwise", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2020, month: 1, day: 1 },
        commercialEnd: { year: 2021, month: 1, day: 1 },
      }),
    );

    await run(inputs({ ref: "release/7.2.0-M1", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("classifies an RC release branch as oss without a generation lookup", async () => {
    await run(inputs({ ref: "release/7.3.0-RC1", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
  });

  it("classifies a first-GA release branch (patch 0) as internal without a generation lookup", async () => {
    await run(inputs({ ref: "release/7.0.0", private: true }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
  });

  it("classifies a first-GA release branch (patch 0) as oss when public", async () => {
    await run(inputs({ ref: "release/7.0.0", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
  });

  it("still performs a real generation lookup for a non-zero patch GA release", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ ref: "release/7.2.3", private: true }),
      new Date(2026, 5, 15),
    );

    expect(websiteModule.__getMock).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
  });

  it("falls back to internal when the generation lookup returns null for a private repository", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ ref: "5.7.x", private: true }));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("falls back to oss when the generation lookup returns null for a public repository", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ ref: "7.1.x", private: false }));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "oss");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("falls back to internal for a private -internal branch when the generation can't be found", async () => {
    websiteModule.__getMock.mockResolvedValue(null);

    await run(inputs({ ref: "4.2.x-internal", private: true }));

    expect(core.setOutput).toHaveBeenCalledWith("channel", "internal");
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("fails for a public -internal branch without a generation lookup, since that's a configuration error", async () => {
    await run(inputs({ ref: "4.2.x-internal", private: false }));

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("configuration error"),
    );
    expect(core.setOutput).not.toHaveBeenCalledWith(
      "channel",
      expect.anything(),
    );
  });

  it("fails for a public -internal branch even when the generation would otherwise resolve", async () => {
    websiteModule.__getMock.mockResolvedValue(
      generation({
        ossEnd: { year: 2026, month: 11, day: 24 },
        commercialEnd: { year: 2027, month: 2, day: 24 },
      }),
    );

    await run(
      inputs({ ref: "6.4.x-internal", private: false }),
      new Date(2026, 5, 15),
    );

    expect(websiteModule.__getMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining("configuration error"),
    );
  });

  it("fails once with the underlying error message when the API throws", async () => {
    websiteModule.__getMock.mockRejectedValue(
      new Error("Projects API returned 503"),
    );

    await run(inputs({ ref: "5.7.x", private: true }));

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith("Projects API returned 503");
    expect(core.setOutput).not.toHaveBeenCalled();
  });
});
