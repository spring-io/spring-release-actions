import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    this.projectName =
      core.getInput("project-name") || _projectSlugFor(this.repository);

    const today = new Date();
    this.year = parseInt(
      core.getInput("year") || String(today.getUTCFullYear()),
      10,
    );
    this.month = parseInt(
      core.getInput("month") || String(today.getUTCMonth() + 1),
      10,
    );

    this.author = core.getInput("author") || process.env.GITHUB_ACTOR;

    this.websiteToken = core.getInput("website-token", { required: true });
    this.websiteRepository =
      core.getInput("website-repository") || "spring-io/spring-website-content";
    this.baseBranch = core.getInput("base-branch") || "main";

    Object.freeze(this);
  }
}

function _projectSlugFor(repository) {
  if (!repository) {
    return repository;
  }
  const name = repository.substring(repository.indexOf("/") + 1);
  return name.endsWith("-commercial")
    ? name.substring(0, name.length - "-commercial".length)
    : name;
}

export { Inputs };
