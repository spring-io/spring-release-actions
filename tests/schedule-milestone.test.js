import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

jest.unstable_mockModule('@actions/core', () => core);

const { Milestones } = await import('../src/milestones.js');
const { default: run } = await import('../src/schedule-milestone/index.js');

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
		scheduleMilestoneSpy = jest.spyOn(Milestones.prototype, 'scheduleMilestone').mockResolvedValue();
	});

	afterEach(() => {
		jest.restoreAllMocks();
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
