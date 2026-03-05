import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Milestones } from '../../src/milestones.js';
import { run } from '../../src/close-milestone/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('close-milestone', () => {
	const defaultInputs = {
		version: 'title',
		repository: 'owner/repo',
		token: 'token'
	};

	let closeMilestoneSpy;

	beforeEach(() => {
		closeMilestoneSpy = vi.spyOn(Milestones.prototype, 'closeMilestone').mockResolvedValue();
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
