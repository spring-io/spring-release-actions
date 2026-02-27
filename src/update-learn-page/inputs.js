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
    this.projectName =
      core.getInput("project-name", { required: false }) ||
      process.env.GITHUB_REPOSITORY;
    const name = this.projectName.substring(this.projectName.indexOf("/") + 1);
    this.projectSlug = name.endsWith("-commercial")
      ? name.substring(0, name.length - "-commercial".length)
      : name;
    this.commercial = this.projectName.includes("commercial");
    this.websiteRepository =
      core.getInput("website-repository", { required: false }) ||
      (this.commercial
        ? "spring-io/spring-website-commercial-content"
        : "spring-io/spring-website-content");
    Object.freeze(this);
  }
}

export { Inputs };
