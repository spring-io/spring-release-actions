import * as core from "@actions/core";

class Inputs {
  constructor() {
    const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
    this.version = core.getInput("version") || "";
    this.refName =
      core.getInput("ref-name") || process.env.GITHUB_REF_NAME || "";
    if (!this.version && !this.refName) {
      throw new Error(
        "Either 'version' or 'ref-name' must be provided (or GITHUB_REF_NAME must be set).",
      );
    }
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.projectSlug =
      core.getInput("project-slug") || repository.replace("-commercial", "");
    this.projectsApiBase = core.getInput("projects-api-base") || undefined;
    Object.freeze(this);
  }
}

export { Inputs };
