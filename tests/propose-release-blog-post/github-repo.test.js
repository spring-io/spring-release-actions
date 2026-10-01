import { vi } from 'vitest';
import {
  octokitFor,
  findReleaseTag,
  getOrCreateBranch,
  commitFile,
  ensurePullRequest,
} from '../../src/propose-release-blog-post/github-repo.js';

function mockOctokit() {
  return {
    rest: {
      git: {
        getRef: vi.fn(),
        createRef: vi.fn(),
      },
      repos: {
        getContent: vi.fn(),
        createOrUpdateFileContents: vi.fn(),
      },
      pulls: {
        list: vi.fn(),
        create: vi.fn(),
      },
    },
  };
}

describe('getOrCreateBranch', () => {
  it('does nothing when the branch already exists', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'existing-sha' } } });

    await getOrCreateBranch(octokit, 'owner', 'repo', 'spring-boot-release-2026.08', 'main');

    expect(octokit.rest.git.getRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'heads/spring-boot-release-2026.08',
    });
    expect(octokit.rest.git.createRef).not.toHaveBeenCalled();
  });

  it('creates the branch from the base branch when it does not exist', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ data: { object: { sha: 'base-sha' } } });

    await getOrCreateBranch(octokit, 'owner', 'repo', 'spring-boot-release-2026.08', 'main');

    expect(octokit.rest.git.getRef).toHaveBeenLastCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'heads/main',
    });
    expect(octokit.rest.git.createRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'refs/heads/spring-boot-release-2026.08',
      sha: 'base-sha',
    });
  });

  it('rethrows unexpected errors', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockRejectedValue({ status: 500, message: 'boom' });

    await expect(
      getOrCreateBranch(octokit, 'owner', 'repo', 'branch', 'main'),
    ).rejects.toEqual({ status: 500, message: 'boom' });
  });
});

describe('commitFile', () => {
  it('creates a file that does not yet exist on the branch', async () => {
    const octokit = mockOctokit();
    octokit.rest.repos.getContent.mockRejectedValue({ status: 404 });

    await commitFile(octokit, 'owner', 'repo', 'branch', 'blog/2026/08/post.md', 'content', 'message');

    expect(octokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'blog/2026/08/post.md',
      branch: 'branch',
      message: 'message',
      content: Buffer.from('content').toString('base64'),
    });
  });

  it('leaves an existing file untouched so review edits are not overwritten', async () => {
    const octokit = mockOctokit();
    octokit.rest.repos.getContent.mockResolvedValue({ data: { sha: 'file-sha' } });

    const committed = await commitFile(octokit, 'owner', 'repo', 'branch', 'blog/2026/08/post.md', 'content', 'message');

    expect(committed).toBe(false);
    expect(octokit.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
  });
});

describe('findReleaseTag', () => {
  it('returns the unprefixed tag when it exists', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockResolvedValue({ data: {} });

    expect(await findReleaseTag(octokit, 'owner', 'repo', '7.0.0')).toBe('7.0.0');
    expect(octokit.rest.git.getRef).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', ref: 'tags/7.0.0' });
  });

  it('falls back to the v-prefixed tag', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce({ data: {} });

    expect(await findReleaseTag(octokit, 'owner', 'repo', '4.0.8')).toBe('v4.0.8');
  });

  it('returns null when neither tag exists', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockRejectedValue({ status: 404 });

    expect(await findReleaseTag(octokit, 'owner', 'repo', '4.0.8')).toBeNull();
  });

  it('rethrows unexpected errors', async () => {
    const octokit = mockOctokit();
    octokit.rest.git.getRef.mockRejectedValue({ status: 500 });

    await expect(findReleaseTag(octokit, 'owner', 'repo', '4.0.8')).rejects.toEqual({ status: 500 });
  });
});

describe('ensurePullRequest', () => {
  it('returns an existing pull request instead of creating a new one', async () => {
    const octokit = mockOctokit();
    const existing = { html_url: 'https://github.com/owner/repo/pull/1' };
    octokit.rest.pulls.list.mockResolvedValue({ data: [existing] });

    const pr = await ensurePullRequest(octokit, 'owner', 'repo', 'branch', 'main', 'title', 'body');

    expect(pr).toBe(existing);
    expect(octokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it('returns a merged pull request rather than opening a duplicate', async () => {
    const octokit = mockOctokit();
    const merged = { html_url: 'https://github.com/owner/repo/pull/3', state: 'closed' };
    octokit.rest.pulls.list.mockResolvedValue({ data: [merged] });

    const pr = await ensurePullRequest(octokit, 'owner', 'repo', 'branch', 'main', 'title', 'body');

    expect(pr).toBe(merged);
    expect(octokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it('creates a pull request when none exists', async () => {
    const octokit = mockOctokit();
    octokit.rest.pulls.list.mockResolvedValue({ data: [] });
    const created = { html_url: 'https://github.com/owner/repo/pull/2' };
    octokit.rest.pulls.create.mockResolvedValue({ data: created });

    const pr = await ensurePullRequest(octokit, 'owner', 'repo', 'branch', 'main', 'title', 'body');

    expect(octokit.rest.pulls.list).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      head: 'owner:branch',
      base: 'main',
      state: 'all',
    });
    expect(octokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      head: 'branch',
      base: 'main',
      title: 'title',
      body: 'body',
    });
    expect(pr).toBe(created);
  });
});

describe('octokitFor', () => {
  it('constructs an Octokit client scoped to OCTOKIT_BASE_URL when set', () => {
    const originalBaseUrl = process.env.OCTOKIT_BASE_URL;
    process.env.OCTOKIT_BASE_URL = 'http://localhost:12345';
    try {
      const octokit = octokitFor('token');
      expect(octokit.rest.git.getRef).toBeInstanceOf(Function);
    } finally {
      process.env.OCTOKIT_BASE_URL = originalBaseUrl;
    }
  });
});
