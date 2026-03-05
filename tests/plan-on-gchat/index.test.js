import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Announce } from '../../src/gchat.js';
import { run } from '../../src/plan-on-gchat/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('plan-on-gchat', () => {
	const defaultInputs = {
		gchatWebhookUrl: 'https://example.com',
		version: 'title',
		versionDate: '2025-12-25',
		projectName: 'repo'
	};

	let planReleaseSpy;

	beforeEach(() => {
		planReleaseSpy = vi.spyOn(Announce.prototype, 'planRelease').mockResolvedValue();
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
