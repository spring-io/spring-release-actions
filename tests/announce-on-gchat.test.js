const core = require('@actions/core');
const { Inputs } = require('../src/announce-on-gchat/inputs');
const { Announce } = require('../src/gchat');
const { run } = require('../src/announce-on-gchat');

jest.mock('@actions/core');
jest.mock('../src/gchat');
jest.mock('../src/announce-on-gchat/inputs');

describe('announce-on-gchat', () => {
	beforeEach(() => {
		process.env.GITHUB_REPOSITORY = 'owner/repo';
	});

	it('announces a release', async () => {
		Inputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
            version: '1.2.3',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		await run();
		expect(Announce.prototype.constructor).toHaveBeenCalledWith('https://example.com', 'repo');
		expect(Announce.prototype.announceRelease).toHaveBeenCalledWith('1.2.3');
	});

	it('uses project-name', async () => {
		inputs = {
            gchatWebhookUrl: 'https://example.com',
			version: '1.2.3',
			projectName: 'project'
        };
        Inputs.mockImplementation(() => inputs);
		await run();
		expect(Announce.prototype.constructor).toHaveBeenCalledWith('https://example.com', 'project');
		expect(Announce.prototype.announceRelease).toHaveBeenCalledWith('1.2.3');
	});

	it('handles errors', async () => {
		Announce.prototype.announceRelease.mockImplementation(() => {
			throw new Error('error');
		});
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
