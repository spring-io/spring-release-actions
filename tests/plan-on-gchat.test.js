import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

const mockInputs = jest.fn();

jest.unstable_mockModule('@actions/core', () => core);

jest.unstable_mockModule('../src/plan-on-gchat/inputs.js', () => ({
	Inputs: mockInputs
}));

const { Announce } = await import('../src/gchat.js');
const { run } = await import('../src/plan-on-gchat/index.js');

describe('plan-on-gchat', () => {
	let planReleaseSpy;

	beforeEach(() => {
		process.env.GITHUB_REPOSITORY = 'owner/repo';
		planReleaseSpy = jest.spyOn(Announce.prototype, 'planRelease').mockResolvedValue();
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: '',
			version: '',
			versionDate: '',
			projectName: process.env.GITHUB_REPOSITORY.split('/')[1]
		}));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('plans a release', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: 'title',
			versionDate: '2025-12-25',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		await run();
		expect(planReleaseSpy).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('uses project-name', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: 'title',
			versionDate: '2025-12-25',
			projectName: 'project'
		}));
		await run();
		expect(planReleaseSpy).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('handles errors', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: 'title',
			versionDate: '2025-12-25',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		planReleaseSpy.mockRejectedValue(new Error('error'));
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
