import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    this.private = core.getBooleanInput("private");
    this.repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this.projectSlug =
      core.getInput("project-slug") || _slugFromRepository(this.repository);
    this.projectsApiBase = core.getInput("projects-api-base") || undefined;
    Object.freeze(this);
  }
}

function _slugFromRepository(repository) {
  const parts = repository.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `'repository' must be in 'owner/repo' format, got '${repository}'.`,
    );
  }
  return parts[1].replace("-commercial", "");
}

export { Inputs };
