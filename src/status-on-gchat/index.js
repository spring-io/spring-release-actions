import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import axios from "axios";
import { Inputs } from "./inputs.js";

function escapeForGchat(text) {
  return (text ?? "").replace(/"/g, '\\"');
}

function computeRunStatus(jobs) {
  const concluded = jobs.filter((j) => j.conclusion);
  if (concluded.length === 0) return "unsuccessful";
  if (
    concluded.every(
      (j) => j.conclusion === "success" || j.conclusion === "skipped",
    )
  )
    return "succeeded";
  if (concluded.some((j) => j.conclusion === "failure")) return "failed";
  if (concluded.some((j) => j.conclusion === "cancelled")) return "cancelled";
  return "unsuccessful";
}

function buildRunInfo(run, serverUrl, repository) {
  const actor = run.triggering_actor ?? run.actor;
  const author = actor?.login;
  const authorUrl = actor?.html_url;

  if (!author) {
    return "Run via scheduled workflow";
  }

  const prs = run.pull_requests ?? [];
  if (prs.length > 0) {
    const pr = prs[0];
    const prUrl = `${serverUrl}/${repository}/pull/${pr.number}`;
    return `Pull request #<${prUrl}|${pr.number}> opened by <${authorUrl}|${author}>`;
  }

  if (run.event === "push" && run.head_sha) {
    const commitUrl = `${serverUrl}/${repository}/commit/${run.head_sha}`;
    const shaId = run.head_sha.substring(0, 7);
    return `Commit <${commitUrl}|${shaId}> pushed by <${authorUrl}|${author}>`;
  }

  return `Manually run by <${authorUrl}|${author}>`;
}

function buildMessage(run, jobs, serverUrl, repository, refName) {
  const runId = run.id;
  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
  const displayTitle = escapeForGchat(
    run.display_title ?? run.head_commit?.message ?? run.name ?? "Workflow run",
  );
  const runStatus = computeRunStatus(jobs);
  const workflowStatus = `<${runUrl}|${displayTitle}> ${runStatus}`;

  const pathPart = run.path ?? "";
  const workflowFilename = pathPart.includes("/")
    ? pathPart.split("/").pop().split("@")[0]
    : "workflow";
  const workflowUrl = `${serverUrl}/${repository}/actions/workflows/${workflowFilename}?query=branch%3A${encodeURIComponent(refName)}`;
  const workflowName = escapeForGchat(run.name ?? "Workflow");
  const workflowInfo = `<${workflowUrl}|${workflowName}> #${run.run_number}`;

  const runInfo = buildRunInfo(run, serverUrl, repository);

  const concludedJobs = jobs.filter((j) => j.conclusion);
  const jobInfo = concludedJobs
    .map((j) => {
      const jobUrl =
        j.html_url ??
        `${serverUrl}/${repository}/actions/runs/${runId}/job/${j.id}`;
      return `* <${jobUrl}|${j.name}> was ${j.conclusion}`;
    })
    .join("\n");

  return `${workflowStatus}\n${workflowInfo}: ${runInfo}\n\n${jobInfo}`;
}

async function run(inputs = new Inputs()) {
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const refName = process.env.GITHUB_REF_NAME ?? "";
  const runId = process.env.GITHUB_RUN_ID;

  if (!runId || !repository) {
    core.setFailed("GITHUB_RUN_ID and GITHUB_REPOSITORY must be set");
    return;
  }

  const octokit = new Octokit({ auth: inputs.token });
  const [owner, repo] = repository.split("/");

  let runResponse;
  let jobsResponse;
  try {
    runResponse = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: parseInt(runId, 10),
    });
    jobsResponse = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: parseInt(runId, 10),
    });
  } catch (error) {
    core.setFailed(`Failed to fetch run or jobs: ${error.message}`);
    return;
  }

  const runData = runResponse.data;
  const jobs = jobsResponse.data.jobs ?? [];
  const runStatus = computeRunStatus(jobs);

  core.setOutput("result", runStatus);

  const text = buildMessage(runData, jobs, serverUrl, repository, refName);

  try {
    await axios.post(inputs.gchatWebhookUrl, { text });
  } catch (error) {
    core.warning(`Failed to send Google Chat notification: ${error.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run, buildMessage, computeRunStatus, buildRunInfo };
