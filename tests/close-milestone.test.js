const core = require('@actions/core');
const { Inputs } = require('../src/close-milestone/inputs');

const run = require('../src/close-milestone');

jest.mock('@actions/core');
jest.mock('../src/milestones');
jest.mock('../src/close-milestone/inputs');

const { Milestones } = require('../src/milestones');

describe('close-milestone', () => {
    beforeEach(() => {
        process.env.GITHUB_REPOSITORY = 'owner/repo';
    });

	it('closes a milestone', async () => {
        Inputs.mockImplementation(() => ({
            version: 'title'
        }));
        await run();
		expect(Milestones.prototype.closeMilestone).toHaveBeenCalledWith('title');
	});

	it('handles errors', async () => {
        Milestones.prototype.closeMilestone.mockImplementation(() => {
            throw new Error('error');
        });
        await run();
        expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
