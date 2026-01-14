const core = require('@actions/core');
const { Inputs } = require('../src/plan-on-gchat/inputs');
const { Announce } = require('../src/gchat');
const { run } = require('../src/plan-on-gchat');

jest.mock('@actions/core');
jest.mock('../src/gchat');
jest.mock('../src/plan-on-gchat/inputs');

describe('plan-on-gchat', () => {
	beforeEach(() => {
		process.env.GITHUB_REPOSITORY = 'owner/repo';
	});

	it('plans a release', async () => {
		Inputs.mockImplementation(() => ({
            gchatWebhookUrl: 'https://example.com',
			version: 'title',
			versionDate: '2025-12-25',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		await run();
		expect(Announce.prototype.constructor).toHaveBeenCalledWith('https://example.com', 'repo');
		expect(Announce.prototype.planRelease).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('uses project-name', async () => {
		inputs = {
            gchatWebhookUrl: 'https://example.com',
			version: 'title',
			versionDate: '2025-12-25',
			projectName: 'project'
        };
        Inputs.mockImplementation(() => inputs);
		await run();
		expect(Announce.prototype.constructor).toHaveBeenCalledWith('https://example.com', 'project');
		expect(Announce.prototype.planRelease).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('handles errors', async () => {
		Announce.prototype.planRelease.mockImplementation(() => {
			throw new Error('error');
		});
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
