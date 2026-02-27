import * as core from "@actions/core";

class Inputs {
  constructor() {
    this.version = core.getInput("version", { required: true });
    Object.freeze(this);
  }
}

export { Inputs };
