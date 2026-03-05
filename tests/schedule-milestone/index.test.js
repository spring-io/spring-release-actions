import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Milestones } from '../../src/milestones.js';
import { run } from '../../src/schedule-milestone/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('schedule-milestone', () => {
	const defaultInputs = {
		version: 'title',
		versionDate: '2025-12-25',
		description: 'description',
		repository: 'owner/repo',
		token: 'token'
	};

	let scheduleMilestoneSpy;

	beforeEach(() => {
		scheduleMilestoneSpy = vi.spyOn(Milestones.prototype, 'scheduleMilestone').mockResolvedValue();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('schedules a milestone', async () => {
		await run(defaultInputs);
		expect(scheduleMilestoneSpy).toHaveBeenCalledWith('title', '2025-12-25', 'description');
	});

	it('handles errors', async () => {
		scheduleMilestoneSpy.mockRejectedValue(new Error('error'));
		await run(defaultInputs);
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
