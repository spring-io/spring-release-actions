import * as core from "@actions/core";

class Inputs {
  constructor() {
    const repository = process.env.GITHUB_REPOSITORY.split("/")[1];
    const commercial = repository.endsWith("-commercial");
    this.version = core.getInput("version", { required: true });
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    this.websiteToken = core.getInput("website-token", { required: true });
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.websiteRepository =
      core.getInput("website-repository") ||
      (commercial
        ? "spring-io/spring-website-commercial-content"
        : "spring-io/spring-website-content");
    this.projectSlug =
      core.getInput("project-slug") || repository.replace("-commercial", "");
  }
}

export { Inputs };
