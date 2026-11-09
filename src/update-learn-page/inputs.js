import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    this.websiteToken = core.getInput("website-token", { required: false });
    this.token =
      core.getInput("token", { required: false }) || process.env.GITHUB_TOKEN;
    this.isAntora = core.getBooleanInput("is-antora", { required: false });
    this.projectName =
      core.getInput("project-name", { required: false }) ||
      process.env.GITHUB_REPOSITORY;
    const name = this.projectName.substring(this.projectName.indexOf("/") + 1);
    this.projectSlug = name.endsWith("-commercial")
      ? name.substring(0, name.length - "-commercial".length)
      : name;
    // The release channel, when given, decides which website: only an OSS
    // release goes to the OSS one. Otherwise the name of the project decides.
    this.releaseChannel = core.getInput("release-channel", { required: false });
    this.commercial = this.releaseChannel
      ? this.releaseChannel !== "oss"
      : this.projectName.includes("commercial");

    // The enterprise website doesn't redirect, so there {version} can't be used
    // and each entry gets the exact {major.minor} of its own version instead
    const docs = this.commercial
      ? "https://docs.enterprise.spring.io/{project}/reference/{major.minor}"
      : "https://docs.spring.io/{project}/reference/{version}";
    // Antora-based projects ship their JavaDoc alongside the reference documentation
    this.apiDocUrl =
      core.getInput("api-doc-url", { required: false }) ||
      (this.commercial || this.isAntora
        ? `${docs}/api/java/index.html`
        : "https://docs.spring.io/{project}/site/docs/{version}/api/");
    this.refDocUrl =
      core.getInput("ref-doc-url", { required: false }) || `${docs}/index.html`;
    this.websiteRepository =
      core.getInput("website-repository", { required: false }) ||
      (this.commercial
        ? "spring-io/spring-website-commercial-content"
        : "spring-io/spring-website-content");
    this.projectsApiBase =
      core.getInput("projects-api-base", { required: false }) || undefined;
    this.resolvedRefDocUrl = this.refDocUrl.replace(
      /{project}|{slug}/g,
      this.projectSlug,
    );
    this.resolvedApiDocUrl = this.apiDocUrl.replace(
      /{project}|{slug}/g,
      this.projectSlug,
    );
    Object.freeze(this);
  }
}

export { Inputs };
