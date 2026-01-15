import * as core from "@actions/core";

class Inputs {
  constructor() {
    this._version = core.getInput("version", { required: true });
    this._websiteToken = core.getInput("website-token", { required: true });
    this._apiDocUrl =
      core.getInput("api-doc-url", { required: false }) ||
      "https://docs.spring.io/{project}/site/docs/{version}/api/";
    this._isAntora = core.getBooleanInput("is-antora", { required: false });
    this._projectName = core.getInput("project-name", { required: false });
    this._refDocUrl =
      core.getInput("ref-doc-url", { required: false }) ||
      "https://docs.spring.io/{project}/reference/{version}/index.html";
    this._websiteRepository = core.getInput("website-repository", {
      required: false,
    });
  }

  get websiteToken() {
    return this._websiteToken;
  }

  get apiDocUrl() {
    return this._apiDocUrl;
  }

  get websiteRepository() {
    if (this._websiteRepository) {
      return this._websiteRepository;
    }
    if (this.projectName.includes("commercial")) {
      return "spring-io/spring-website-commercial-content";
    }
    return "spring-io/spring-website-content";
  }

  get isAntora() {
    return this._isAntora;
  }

  get projectName() {
    if (this._projectName) {
      return this._projectName;
    }
    return process.env.GITHUB_REPOSITORY;
  }

  get projectSlug() {
    const name = this.projectName.substring(this.projectName.indexOf("/") + 1);
    if (name.endsWith("-commercial")) {
      return name.substring(0, name.length - "-commercial".length);
    }
    return name;
  }

  get refDocUrl() {
    return this._refDocUrl;
  }

  get version() {
    return this._version;
  }

  get commercial() {
    return this.projectName.includes("commercial");
  }
}

export { Inputs };
