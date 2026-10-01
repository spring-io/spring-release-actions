import * as core from "@actions/core";
import { Inputs } from "./inputs.js";
import { Milestones } from "../milestones.js";
import { buildTemplateData, loadTemplate, renderPost } from "./template.js";
import {
  octokitFor,
  findReleaseTag,
  getOrCreateBranch,
  commitFile,
  ensurePullRequest,
} from "./github-repo.js";

async function run(inputs = new Inputs()) {
  try {
    const milestones = new Milestones(inputs.token, inputs.repository, core);
    const closed = await milestones.findClosedMilestonesDueWithin(
      inputs.year,
      inputs.month,
    );

    const [sourceOwner, sourceRepo] = inputs.repository.split("/");
    const sourceOctokit = octokitFor(inputs.token);
    const released = [];
    for (const milestone of closed) {
      const tag = await findReleaseTag(
        sourceOctokit,
        sourceOwner,
        sourceRepo,
        milestone.name,
      );
      if (tag) {
        released.push({ ...milestone, tag });
      } else {
        core.info(`No tag found for ${milestone.name}; skipping it`);
      }
    }

    if (released.length === 0) {
      core.info(
        `No released milestones found for ${inputs.projectName} in ${inputs.year}-${inputs.month}; nothing to propose`,
      );
      return;
    }

    const data = buildTemplateData(inputs.projectName, released, {
      repository: inputs.repository,
      author: inputs.author,
    });
    const post = renderPost(loadTemplate(), data);

    const month = String(inputs.month).padStart(2, "0");
    const branch = `${inputs.projectName}-release-${inputs.year}.${month}`;
    const filePath = `blog/${inputs.year}/${month}/${inputs.projectName}-release-${inputs.year}-${month}.md`;

    const [owner, repo] = inputs.websiteRepository.split("/");
    const octokit = octokitFor(inputs.websiteToken);

    await getOrCreateBranch(
      octokit,
      owner,
      repo,
      branch,
      inputs.baseBranch,
      core,
    );
    await commitFile(
      octokit,
      owner,
      repo,
      branch,
      filePath,
      post,
      `Propose ${data.projectName} release blog post for ${inputs.year}-${month}`,
      core,
    );
    const pr = await ensurePullRequest(
      octokit,
      owner,
      repo,
      branch,
      inputs.baseBranch,
      `${data.projectName} release blog post for ${inputs.year}-${month}`,
      `This is an automatically proposed draft announcing the following ${data.projectName} releases for ${inputs.year}-${month}:\n\n${released.map((m) => `- ${m.name}`).join("\n")}\n\nPlease review and edit before merging.`,
      core,
    );

    core.setOutput("branch", branch);
    core.setOutput("path", filePath);
    core.setOutput("pull-request-url", pr.html_url);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
