import { Octokit } from "@octokit/rest";

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * Build an {@linkcode Octokit} client for the website repository, honoring
 * {@code OCTOKIT_BASE_URL} the same way {@linkcode Milestones} does so that
 * tests can point it at a mock server.
 *
 * @param {string} token
 * @returns {Octokit}
 */
function octokitFor(token) {
  const baseUrl = process.env.OCTOKIT_BASE_URL;
  return new Octokit({ auth: token, ...(baseUrl && { baseUrl }) });
}

/**
 * Find the git tag a version was released under. Projects differ on whether
 * they prefix the version with "v" (for example, spring-boot does while
 * spring-security does not), so both forms are tried.
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} version
 * @returns {Promise<string|null>} the tag name, or null if the version was never tagged
 */
async function findReleaseTag(octokit, owner, repo, version) {
  for (const tag of [version, `v${version}`]) {
    try {
      await octokit.rest.git.getRef({ owner, repo, ref: `tags/${tag}` });
      return tag;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  }
  return null;
}

/**
 * Ensure a branch exists on the given repository, creating it from
 * {@code baseBranch} if it does not already exist.
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {string} baseBranch
 * @param {object} core
 */
async function getOrCreateBranch(
  octokit,
  owner,
  repo,
  branch,
  baseBranch,
  core = _noOpCore,
) {
  try {
    await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
    core.info(`Branch ${branch} already exists; reusing it`);
    return;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  const base = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: base.data.object.sha,
  });
  core.info(`Created branch ${branch} from ${baseBranch}`);
}

/**
 * Create a file on the given branch. An existing file is left untouched so
 * that edits made during review are never overwritten.
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {string} filePath
 * @param {string} content
 * @param {string} message
 * @param {object} core
 * @returns {Promise<boolean>} whether the file was committed
 */
async function commitFile(
  octokit,
  owner,
  repo,
  branch,
  filePath,
  content,
  message,
  core = _noOpCore,
) {
  try {
    await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    core.info(`${filePath} already exists on ${branch}; leaving it as is`);
    return false;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    branch,
    message,
    content: Buffer.from(content).toString("base64"),
  });
  core.info(`Committed ${filePath} to ${branch}`);
  return true;
}

/**
 * Open a pull request for the given branch, or return the existing one (open,
 * merged or closed) so that a re-run does not try to open a duplicate.
 *
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {string} baseBranch
 * @param {string} title
 * @param {string} body
 * @param {object} core
 * @returns {Promise<{ html_url: string }>}
 */
async function ensurePullRequest(
  octokit,
  owner,
  repo,
  branch,
  baseBranch,
  title,
  body,
  core = _noOpCore,
) {
  const { data: existing } = await octokit.rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${branch}`,
    base: baseBranch,
    state: "all",
  });

  if (existing.length > 0) {
    core.info(
      `Pull request already exists (${existing[0].state}): ${existing[0].html_url}`,
    );
    return existing[0];
  }

  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    head: branch,
    base: baseBranch,
    title,
    body,
  });
  core.info(`Opened pull request: ${pr.html_url}`);
  return pr;
}

export {
  octokitFor,
  findReleaseTag,
  getOrCreateBranch,
  commitFile,
  ensurePullRequest,
};
