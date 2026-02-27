import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

jest.unstable_mockModule('@actions/core', () => core);

const { Announce } = await import('../src/gchat.js');
const { run } = await import('../src/plan-on-gchat/index.js');

describe('plan-on-gchat', () => {
	const defaultInputs = {
		gchatWebhookUrl: 'https://example.com',
		version: 'title',
		versionDate: '2025-12-25',
		projectName: 'repo'
	};

	let planReleaseSpy;

	beforeEach(() => {
		planReleaseSpy = jest.spyOn(Announce.prototype, 'planRelease').mockResolvedValue();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('plans a release', async () => {
		await run(defaultInputs);
		expect(planReleaseSpy).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('uses project-name', async () => {
		await run({ ...defaultInputs, projectName: 'project' });
		expect(planReleaseSpy).toHaveBeenCalledWith('title', '2025-12-25');
	});

	it('handles errors', async () => {
		planReleaseSpy.mockRejectedValue(new Error('error'));
		await run(defaultInputs);
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
