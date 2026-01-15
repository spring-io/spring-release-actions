import * as core from "@actions/core";

class Inputs {
  constructor() {
    this._version = core.getInput("version", { required: true });
  }

  get version() {
    return this._version;
  }
}

export { Inputs };
