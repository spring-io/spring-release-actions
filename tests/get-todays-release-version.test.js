import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

const mockFindOpenMilestoneDueTodayForGeneration = jest.fn();

jest.unstable_mockModule('@actions/core', () => core);

jest.unstable_mockModule('../src/milestones.js', () => ({
	Milestones: jest.fn().mockImplementation(() => ({
		findOpenMilestoneDueTodayForGeneration: mockFindOpenMilestoneDueTodayForGeneration
	}))
}));

const { run } = await import('../src/get-todays-release-version/index.js');

describe('get-todays-release-version', () => {
	const defaultInputs = {
		version: '',
		milestoneRepository: 'owner/repo',
		milestoneToken: 'token'
	};

	beforeEach(() => {
		mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue(null);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('when version ends in -SNAPSHOT', () => {
		it('finds a milestone due today for the generation', async () => {
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue({ name: '6.2.0-RC1' });
			await run({ ...defaultInputs, version: '6.2.0-SNAPSHOT' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '6.2.0-RC1');
		});

		it('returns empty when no milestone is due today', async () => {
			await run({ ...defaultInputs, version: '6.2.0-SNAPSHOT' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
		});
	});

	describe('when version ends in .x', () => {
		it('finds a milestone due today for the generation', async () => {
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue({ name: '6.2.1' });
			await run({ ...defaultInputs, version: '6.2.x' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '6.2.1');
		});

		it('returns empty when no milestone is due today', async () => {
			await run({ ...defaultInputs, version: '6.2.x' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
		});
	});

	describe('when version is not a snapshot', () => {
		it('returns empty for a GA version', async () => {
			await run({ ...defaultInputs, version: '6.2.0' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).not.toHaveBeenCalled();
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
		});

		it('returns empty for a pre-release version', async () => {
			await run({ ...defaultInputs, version: '6.2.0-RC1' });
			expect(mockFindOpenMilestoneDueTodayForGeneration).not.toHaveBeenCalled();
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
		});
	});
});
