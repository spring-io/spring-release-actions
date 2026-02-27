import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    this.websiteToken = core.getInput("website-token", { required: true });
    this.apiDocUrl =
      core.getInput("api-doc-url", { required: false }) ||
      "https://docs.spring.io/{project}/site/docs/{version}/api/";
    this.isAntora = core.getBooleanInput("is-antora", { required: false });
    this.refDocUrl =
      core.getInput("ref-doc-url", { required: false }) ||
      "https://docs.spring.io/{project}/reference/{version}/index.html";
    this._projectName = core.getInput("project-name", { required: false });
    this._websiteRepository = core.getInput("website-repository", {
      required: false,
    });
  }

  get projectName() {
    return this._projectName || process.env.GITHUB_REPOSITORY;
  }

  get projectSlug() {
    const name = this.projectName.substring(this.projectName.indexOf("/") + 1);
    return name.endsWith("-commercial")
      ? name.substring(0, name.length - "-commercial".length)
      : name;
  }

  get websiteRepository() {
    return (
      this._websiteRepository ||
      (this.projectName.includes("commercial")
        ? "spring-io/spring-website-commercial-content"
        : "spring-io/spring-website-content")
    );
  }

  get commercial() {
    return this.projectName.includes("commercial");
  }
}

export { Inputs };
