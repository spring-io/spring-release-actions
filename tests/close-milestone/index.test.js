import { jest } from '@jest/globals';
import * as core from '../../__fixtures__/core.js';

jest.unstable_mockModule('@actions/core', () => core);

const { Milestones } = await import('../../src/milestones.js');
const { run } = await import('../../src/close-milestone/index.js');

describe('close-milestone', () => {
	const defaultInputs = {
		version: 'title',
		repository: 'owner/repo',
		token: 'token'
	};

	let closeMilestoneSpy;

	beforeEach(() => {
		closeMilestoneSpy = jest.spyOn(Milestones.prototype, 'closeMilestone').mockResolvedValue();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('closes a milestone', async () => {
		await run(defaultInputs);
		expect(closeMilestoneSpy).toHaveBeenCalledWith('title');
	});

	it('handles errors', async () => {
		closeMilestoneSpy.mockRejectedValue(new Error('error'));
		await run(defaultInputs);
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
