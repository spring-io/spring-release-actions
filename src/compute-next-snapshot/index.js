import * as core from "@actions/core";

import { Inputs } from "./inputs.js";
import { Version } from "../versions.js";

const inputs = new Inputs();

async function run() {
  const version = new Version(inputs.version);
  const next = version.nextSnapshot();
  core.setOutput("version", next.version);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
