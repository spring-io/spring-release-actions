import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { Website } from "../src/website.js";
import { Version } from "../src/versions.js";

describe("Website constructor project-slug validation", () => {
  function inputs(projectSlug) {
    return { projectSlug, projectsApiBase: "https://api.spring.io" };
  }

  it("accepts a normal Spring project slug", () => {
    expect(() => new Website(inputs("spring-security"))).not.toThrow();
  });

  it("accepts a single-word slug", () => {
    expect(() => new Website(inputs("spring"))).not.toThrow();
  });

  it("rejects a slug containing a slash", () => {
    expect(() => new Website(inputs("spring/security"))).toThrow(
      /project-slug/,
    );
  });

  it("rejects a slug containing path traversal", () => {
    expect(() => new Website(inputs("../etc"))).toThrow(/project-slug/);
  });

  it("rejects a slug containing a query separator", () => {
    expect(() => new Website(inputs("spring?evil=1"))).toThrow(/project-slug/);
  });

  it("rejects an uppercase slug", () => {
    expect(() => new Website(inputs("Spring-Security"))).toThrow(
      /project-slug/,
    );
  });

  it("rejects an empty slug", () => {
    expect(() => new Website(inputs(""))).toThrow(/project-slug/);
  });

  it("rejects a slug starting with a hyphen", () => {
    expect(() => new Website(inputs("-spring"))).toThrow(/project-slug/);
  });
});

describe("Website getGenerationByVersion facade fallback", () => {
  let apiBase;

  beforeEach(async () => {
    apiBase = join(tmpdir(), `spring-website-test-${Math.random()}`);
    await mkdir(join(apiBase, "projects", "spring-boot"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    await rm(apiBase, { recursive: true, force: true });
  });

  function website() {
    return new Website({
      projectSlug: "spring-boot",
      projectsApiBase: apiBase,
    });
  }

  async function writeGenerations(generations) {
    await writeFile(
      join(apiBase, "projects", "spring-boot", "generations.json"),
      JSON.stringify({ generations }),
    );
  }

  it("falls back to a facade OSS generation for a milestone when no matching generation exists", async () => {
    await writeGenerations([
      {
        name: "1.0",
        ossSupportEndDate: "2028-01",
        commercialSupportEndDate: "2031-01",
      },
    ]);
    const version = new Version("2.0.0-M1", new Date(2026, 0, 15));

    const generation = await website().getGenerationByVersion(version);

    expect(generation.major).toBe(2);
    expect(generation.minor).toBe(0);
    expect(generation.oss.end).toEqual({ year: 9999, month: 12, day: 31 });
    expect(generation.enterprise.end).toEqual({
      year: 9999,
      month: 12,
      day: 31,
    });
  });

  it("falls back to a facade OSS generation for a milestone when the lookup fails", async () => {
    const version = new Version("2.0.0-RC1", new Date(2026, 0, 15));

    const generation = await new Website({
      projectSlug: "spring-boot",
      projectsApiBase: join(apiBase, "does-not-exist"),
    }).getGenerationByVersion(version);

    expect(generation.major).toBe(2);
    expect(generation.minor).toBe(0);
    expect(generation.oss.end).toEqual({ year: 9999, month: 12, day: 31 });
  });

  it("returns null for a GA version when no matching generation exists", async () => {
    await writeGenerations([
      {
        name: "1.0",
        ossSupportEndDate: "2028-01",
        commercialSupportEndDate: "2031-01",
      },
    ]);
    const version = new Version("2.0.0", new Date(2026, 0, 15));

    const generation = await website().getGenerationByVersion(version);

    expect(generation).toBeNull();
  });

  it("throws for a GA version when the lookup fails", async () => {
    const version = new Version("2.0.0", new Date(2026, 0, 15));

    await expect(
      new Website({
        projectSlug: "spring-boot",
        projectsApiBase: join(apiBase, "does-not-exist"),
      }).getGenerationByVersion(version),
    ).rejects.toThrow();
  });
});
