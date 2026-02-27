import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

const mockInputs = jest.fn();

jest.unstable_mockModule('@actions/core', () => core);

jest.unstable_mockModule('../src/close-milestone/inputs.js', () => ({
	Inputs: mockInputs
}));

const { Milestones } = await import('../src/milestones.js');
const { default: run } = await import('../src/close-milestone/index.js');

describe('close-milestone', () => {
	let closeMilestoneSpy;

	beforeEach(() => {
		process.env.GITHUB_REPOSITORY = 'owner/repo';
		closeMilestoneSpy = jest.spyOn(Milestones.prototype, 'closeMilestone').mockResolvedValue();
		mockInputs.mockImplementation(() => ({
			version: '',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('closes a milestone', async () => {
		mockInputs.mockImplementation(() => ({
			version: 'title',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
		await run();
		expect(closeMilestoneSpy).toHaveBeenCalledWith('title');
	});

	it('handles errors', async () => {
		mockInputs.mockImplementation(() => ({
			version: 'title',
			repository: process.env.GITHUB_REPOSITORY,
			token: 'token'
		}));
		closeMilestoneSpy.mockRejectedValue(new Error('error'));
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
