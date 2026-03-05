import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { run } from '../../src/get-todays-release-version/index.js';

const mockFindOpenMilestoneDueTodayForGeneration = vi.hoisted(() => vi.fn());

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

vi.mock('../../src/milestones.js', () => ({
	Milestones: vi.fn().mockImplementation(() => ({
		findOpenMilestoneDueTodayForGeneration: mockFindOpenMilestoneDueTodayForGeneration
	}))
}));

describe('get-todays-release-version', () => {
	const defaultInputs = {
		version: '',
		milestoneRepository: 'owner/repo',
		milestoneToken: 'token'
	};

	beforeEach(() => {
		mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue(null);
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
