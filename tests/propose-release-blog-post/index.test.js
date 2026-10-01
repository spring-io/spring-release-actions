import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Milestones } from '../../src/milestones.js';
import { run } from '../../src/propose-release-blog-post/index.js';
import * as website from '../../src/propose-release-blog-post/github-repo.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));
vi.mock('../../src/propose-release-blog-post/github-repo.js', () => ({
  octokitFor: vi.fn(() => ({ id: 'octokit' })),
  findReleaseTag: vi.fn(),
  getOrCreateBranch: vi.fn(),
  commitFile: vi.fn(),
  ensurePullRequest: vi.fn(),
}));

describe('propose-release-blog-post', () => {
  const defaultInputs = {
    repository: 'spring-projects/spring-boot',
    token: 'token',
    projectName: 'spring-boot',
    year: 2026,
    month: 8,
    author: 'octocat',
    websiteToken: 'website-token',
    websiteRepository: 'spring-io/spring-website-content',
    baseBranch: 'main',
  };

  let findClosedMilestonesSpy;

  beforeEach(() => {
    findClosedMilestonesSpy = vi.spyOn(Milestones.prototype, 'findClosedMilestonesDueWithin');
    website.findReleaseTag.mockImplementation(async (o, owner, repo, version) => `v${version}`);
    website.ensurePullRequest.mockResolvedValue({ html_url: 'https://github.com/spring-io/spring-website-content/pull/1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when there are no closed milestones for that month', async () => {
    findClosedMilestonesSpy.mockResolvedValue([]);

    await run(defaultInputs);

    expect(website.getOrCreateBranch).not.toHaveBeenCalled();
    expect(website.commitFile).not.toHaveBeenCalled();
    expect(website.ensurePullRequest).not.toHaveBeenCalled();
  });

  it('skips milestones that were never tagged', async () => {
    findClosedMilestonesSpy.mockResolvedValue([{ number: 42, name: '4.0.8' }]);
    website.findReleaseTag.mockResolvedValue(null);

    await run(defaultInputs);

    expect(website.commitFile).not.toHaveBeenCalled();
    expect(website.ensurePullRequest).not.toHaveBeenCalled();
  });

  it('proposes a branch, file, and pull request for the closed milestones', async () => {
    findClosedMilestonesSpy.mockResolvedValue([{ number: 42, name: '4.0.8' }]);

    await run(defaultInputs);

    expect(website.getOrCreateBranch).toHaveBeenCalledWith(
      { id: 'octokit' },
      'spring-io',
      'spring-website-content',
      'spring-boot-release-2026.08',
      'main',
      expect.anything(),
    );
    expect(website.commitFile).toHaveBeenCalledWith(
      { id: 'octokit' },
      'spring-io',
      'spring-website-content',
      'spring-boot-release-2026.08',
      'blog/2026/08/spring-boot-release-2026-08.md',
      expect.stringContaining('## 4.0.8'),
      expect.stringContaining('Spring Boot'),
      expect.anything(),
    );
    expect(core.setOutput).toHaveBeenCalledWith('branch', 'spring-boot-release-2026.08');
    expect(core.setOutput).toHaveBeenCalledWith('path', 'blog/2026/08/spring-boot-release-2026-08.md');
    expect(core.setOutput).toHaveBeenCalledWith(
      'pull-request-url',
      'https://github.com/spring-io/spring-website-content/pull/1',
    );
  });

  it('handles errors', async () => {
    findClosedMilestonesSpy.mockRejectedValue(new Error('error'));

    await run(defaultInputs);

    expect(core.setFailed).toHaveBeenCalledWith('error');
  });
});
