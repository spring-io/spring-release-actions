import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Announce } from '../../src/gchat.js';
import { run } from '../../src/announce-on-gchat/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('announce-on-gchat', () => {
	const defaultInputs = {
		gchatWebhookUrl: 'https://example.com',
		version: '1.2.3',
		projectName: 'repo'
	};

	let announceReleaseSpy;

	beforeEach(() => {
		announceReleaseSpy = vi.spyOn(Announce.prototype, 'announceRelease').mockResolvedValue();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('announces a release', async () => {
		await run(defaultInputs);
		expect(announceReleaseSpy).toHaveBeenCalledWith('1.2.3');
	});

	it('uses project-name', async () => {
		await run({ ...defaultInputs, projectName: 'project' });
		expect(announceReleaseSpy).toHaveBeenCalledWith('1.2.3');
	});

	it('handles errors', async () => {
		announceReleaseSpy.mockRejectedValue(new Error('error'));
		await run(defaultInputs);
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
