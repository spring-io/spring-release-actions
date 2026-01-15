import * as core from "@actions/core";

class Inputs {
  constructor() {
    const repository = process.env.GITHUB_REPOSITORY.split("/")[1];
    const commercial = repository.endsWith("-commercial");
    this._version = core.getInput("version", { required: true });
    this._token = core.getInput("token", {
      required: true,
    });
    this._websiteToken = core.getInput("website-token", { required: true });
    this._repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    let websiteRepository = core.getInput("website-repository");
    if (!websiteRepository) {
      websiteRepository = commercial
        ? "spring-io/spring-website-commercial-content"
        : "spring-io/spring-website-content";
    }
    let projectSlug = core.getInput("project-slug");
    if (!projectSlug) {
      projectSlug = repository.replace("-commercial", "");
    }
    this._projectSlug = projectSlug;
    this._websiteRepository = websiteRepository;
  }

  get version() {
    return this._version;
  }

  get token() {
    return this._token;
  }

  get websiteToken() {
    return this._websiteToken;
  }

  get repository() {
    return this._repository;
  }

  get projectSlug() {
    return this._projectSlug;
  }

  get websiteRepository() {
    return this._websiteRepository;
  }
}

export { Inputs };
