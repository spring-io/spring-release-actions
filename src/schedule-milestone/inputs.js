import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version");
    this.versionDate = core.getInput("version-date");
    this.description = core.getInput("description");
    this.versionType = core.getInput("version-type");
    this.repository =
      core.getInput("repository") ||
      _repositoryForVersionType(
        this.versionType,
        process.env.GITHUB_REPOSITORY,
      );
    this.token = core.getInput("token") || process.env.GITHUB_TOKEN;
    Object.freeze(this);
  }
}

function _repositoryForVersionType(versionType, repository) {
  if (!versionType || !repository) {
    return repository;
  }
  const [owner, name] = repository.split("/");
  const isCommercial = name.endsWith("-commercial");
  if (versionType === "oss") {
    return isCommercial
      ? `${owner}/${name.substring(0, name.length - "-commercial".length)}`
      : repository;
  }
  return isCommercial ? repository : `${owner}/${name}-commercial`;
}

export { Inputs };
