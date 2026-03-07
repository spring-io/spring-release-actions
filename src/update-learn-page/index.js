import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { Inputs } from "./inputs.js";
import { Entry, LearnPage } from "../learn.js";
import { Version } from "../versions.js";

function buildUpdatedPage(
  existingJson,
  version,
  isAntora,
  refDocUrl,
  apiDocUrl,
  commercial,
) {
  const learnPage = new LearnPage(existingJson ?? "[]");
  const latestEntry = new Entry(version, isAntora, refDocUrl, apiDocUrl);

  if (commercial) {
    learnPage.entries = [latestEntry, ...learnPage.entries];
  } else {
    const snapshot = version.nextSnapshot();
    const snapshotEntry = new Entry(snapshot, isAntora, refDocUrl, apiDocUrl);
    const filtered = learnPage.entries.filter(
      (e) => !e.version.isSameMajorMinor(version),
    );
    learnPage.entries = [latestEntry, snapshotEntry, ...filtered];
  }

  return learnPage.toString();
}

async function run(inputs = new Inputs()) {
  if (inputs.version.endsWith("-SNAPSHOT")) {
    core.setFailed(
      "Please specify a non-SNAPSHOT release version to publish; it's accompanying SNAPSHOT version will also be published",
    );
    return;
  }
  const baseUrl = process.env.GITHUB_API_URL;
  const octokit = new Octokit({
    auth: inputs.websiteToken,
    ...(baseUrl && { baseUrl }),
  });
  const [owner, repo] = inputs.websiteRepository.split("/");
  const path = `project/${inputs.projectSlug}/documentation.json`;
  const ref = "main";

  let file;
  try {
    core.info(`Retrieving ${path} from ${owner}/${repo}@${ref}`);
    const response = await octokit.repos.getContent({ owner, repo, path, ref });
    file = {
      content: Buffer.from(response.data.content, "base64").toString(),
      sha: response.data.sha,
    };
  } catch (error) {
    if (error.status !== 404) {
      core.setFailed(`Error getting file content: ${error.message}`);
      return;
    }
  }

  const version = new Version(inputs.version);
  const refDocUrl = inputs.refDocUrl.replace(
    /{project}|{slug}/g,
    inputs.projectSlug,
  );
  const apiDocUrl = inputs.apiDocUrl.replace(
    /{project}|{slug}/g,
    inputs.projectSlug,
  );

  const updatedContent = Buffer.from(
    buildUpdatedPage(
      file?.content,
      version,
      inputs.isAntora,
      refDocUrl,
      apiDocUrl,
      inputs.commercial,
    ),
  ).toString("base64");
  const message = `Update #learn Page for ${inputs.projectName} ${inputs.version}`;
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: updatedContent,
    sha: file ? file.sha : undefined,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run, buildUpdatedPage };
