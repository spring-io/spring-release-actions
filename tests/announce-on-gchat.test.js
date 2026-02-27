import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

jest.unstable_mockModule('@actions/core', () => core);

const { Announce } = await import('../src/gchat.js');
const { run } = await import('../src/announce-on-gchat/index.js');

describe('announce-on-gchat', () => {
	const defaultInputs = {
		gchatWebhookUrl: 'https://example.com',
		version: '1.2.3',
		projectName: 'repo'
	};

	let announceReleaseSpy;

	beforeEach(() => {
		announceReleaseSpy = jest.spyOn(Announce.prototype, 'announceRelease').mockResolvedValue();
	});

	afterEach(() => {
		jest.restoreAllMocks();
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
