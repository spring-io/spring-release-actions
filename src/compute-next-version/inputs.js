import * as core from "@actions/core";

class Inputs {
  constructor() {
    const repository = process.env.GITHUB_REPOSITORY.split("/")[1];
    this.version = core.getInput("version", { required: true });
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.projectSlug =
      core.getInput("project-slug") || repository.replace("-commercial", "");
    this.projectsApiBase = core.getInput("projects-api-base") || undefined;
    Object.freeze(this);
  }
}

export { Inputs };
