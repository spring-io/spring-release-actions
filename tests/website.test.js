import { Website } from "../src/website.js";

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
