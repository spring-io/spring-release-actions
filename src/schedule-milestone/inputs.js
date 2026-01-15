import * as core from "@actions/core";

class Inputs {
  constructor() {
    this._versionDate = core.getInput("version-date");
    this._version = core.getInput("version");
    this._description = core.getInput("description");
    this._repository =
      core.getInput("repository") || process.env.GITHUB_REPOSITORY;
    this._token = core.getInput("token") || process.env.GITHUB_TOKEN;
  }

  get versionDate() {
    return this._versionDate;
  }

  get version() {
    return this._version;
  }

  get description() {
    return this._description;
  }

  get repository() {
    return this._repository;
  }

  get token() {
    return this._token;
  }
}

export { Inputs };
