const core = require('@actions/core');
const { Inputs } = require('../src/schedule-milestone/inputs');
const { Milestones } = require('../src/milestones');
const run = require('../src/schedule-milestone');

jest.mock('@actions/core');
jest.mock('../src/milestones');
jest.mock('../src/schedule-milestone/inputs');

describe('schedule-milestone', () => {
	it('schedules a milestone', async () => {
        Inputs.mockImplementation(() => ({
			version: 'title',
            versionDate: '2025-12-25',
			description: 'description'
		}));
		await run();
		expect(Milestones.prototype.scheduleMilestone).toHaveBeenCalledWith('title', '2025-12-25', 'description');
	});

	it('handles errors', async () => {
        Milestones.prototype.scheduleMilestone.mockImplementation(() => {
			throw new Error('error');
		});
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
