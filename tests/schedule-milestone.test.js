import { jest } from '@jest/globals';

const mockSetFailed = jest.fn();
const mockInputs = jest.fn();

jest.unstable_mockModule('@actions/core', () => ({
	setFailed: mockSetFailed
}));

jest.unstable_mockModule('../src/schedule-milestone/inputs.js', () => ({
	Inputs: mockInputs
}));

const { Milestones } = await import('../src/milestones.js');
const { default: run } = await import('../src/schedule-milestone/index.js');

describe('schedule-milestone', () => {
	let scheduleMilestoneSpy;

	beforeEach(() => {
		mockSetFailed.mockClear();
		mockInputs.mockClear();
		process.env.GITHUB_REPOSITORY = 'owner/repo';
		scheduleMilestoneSpy = jest.spyOn(Milestones.prototype, 'scheduleMilestone').mockResolvedValue();
		mockInputs.mockImplementation(() => ({
			version: '',
			versionDate: '',
			description: '',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('schedules a milestone', async () => {
		mockInputs.mockImplementation(() => ({
			version: 'title',
			versionDate: '2025-12-25',
			description: 'description',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
		await run();
		expect(scheduleMilestoneSpy).toHaveBeenCalledWith('title', '2025-12-25', 'description');
	});

	it('handles errors', async () => {
		mockInputs.mockImplementation(() => ({
			version: 'title',
			versionDate: '2025-12-25',
			description: 'description',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
		scheduleMilestoneSpy.mockRejectedValue(new Error('error'));
		await run();
		expect(mockSetFailed).toHaveBeenCalledWith('error');
	});
});
