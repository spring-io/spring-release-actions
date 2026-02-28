import * as core from "@actions/core";
import { Inputs } from "./inputs.js";

async function run(inputs = new Inputs()) {
  const isCommercial = inputs.repository.endsWith("-commercial");

  let uri;
  let name;

  if (isCommercial) {
    uri = "https://usw1.packages.broadcom.com";
    if (inputs.version.includes("-SNAPSHOT")) {
      name = "spring-enterprise-maven-dev-local";
    } else if (
      inputs.version.includes("-RC") ||
      inputs.version.includes("-M")
    ) {
      name = "spring-enterprise-maven-stage-local";
    } else {
      name = "spring-enterprise-maven-prod-local";
    }
  } else {
    if (inputs.version.includes("-SNAPSHOT")) {
      uri = "https://repo.spring.io";
      name = "libs-snapshot-local";
    } else {
      uri = "https://repo1.maven.org";
      name = "maven2";
    }
  }

  core.setOutput("uri", uri);
  core.setOutput("name", name);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
