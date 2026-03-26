import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { run } from '../../src/compute-next-scheduled-milestone/index.js';

const mockFindNextOpenMilestoneForGeneration = vi.hoisted(() => vi.fn());

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

vi.mock('../../src/milestones.js', () => ({
	Milestones: vi.fn().mockImplementation(() => ({
		findNextOpenMilestoneForGeneration: mockFindNextOpenMilestoneForGeneration
	}))
}));

describe('compute-next-scheduled-milestone', () => {
	const defaultInputs = {
		version: '',
		milestoneRepository: 'owner/repo',
		milestoneToken: 'token'
	};

	beforeEach(() => {
		mockFindNextOpenMilestoneForGeneration.mockReturnValue(null);
	});

	describe('when version ends in -SNAPSHOT', () => {
		it('finds the next scheduled milestone and reports 0 days when due today', async () => {
			const today = new Date();
			mockFindNextOpenMilestoneForGeneration.mockReturnValue({ name: '6.2.0-RC1', dueDate: today });
			await run({ ...defaultInputs, version: '6.2.0-SNAPSHOT' });
			expect(mockFindNextOpenMilestoneForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '6.2.0-RC1');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', 0);
		});

		it('finds the next scheduled milestone and reports days when due in the future', async () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 5);
			mockFindNextOpenMilestoneForGeneration.mockReturnValue({ name: '6.2.0-RC1', dueDate: tomorrow });
			await run({ ...defaultInputs, version: '6.2.0-SNAPSHOT' });
			expect(mockFindNextOpenMilestoneForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '6.2.0-RC1');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', 5);
		});

		it('returns empty when no upcoming milestone exists', async () => {
			await run({ ...defaultInputs, version: '6.2.0-SNAPSHOT' });
			expect(mockFindNextOpenMilestoneForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', '');
		});
	});

	describe('when version ends in .x', () => {
		it('finds the next scheduled milestone and reports 0 days when due today', async () => {
			const today = new Date();
			mockFindNextOpenMilestoneForGeneration.mockReturnValue({ name: '6.2.1', dueDate: today });
			await run({ ...defaultInputs, version: '6.2.x' });
			expect(mockFindNextOpenMilestoneForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '6.2.1');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', 0);
		});

		it('returns empty when no upcoming milestone exists', async () => {
			await run({ ...defaultInputs, version: '6.2.x' });
			expect(mockFindNextOpenMilestoneForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', '');
		});
	});

	describe('when version is not a snapshot', () => {
		it('returns empty for a GA version', async () => {
			await run({ ...defaultInputs, version: '6.2.0' });
			expect(mockFindNextOpenMilestoneForGeneration).not.toHaveBeenCalled();
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', '');
		});

		it('returns empty for a pre-release version', async () => {
			await run({ ...defaultInputs, version: '6.2.0-RC1' });
			expect(mockFindNextOpenMilestoneForGeneration).not.toHaveBeenCalled();
			expect(core.setOutput).toHaveBeenCalledWith('release-version', '');
			expect(core.setOutput).toHaveBeenCalledWith('days-til-release', '');
		});
	});
});
