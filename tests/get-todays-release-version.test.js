import { jest } from '@jest/globals';

const mockSetFailed = jest.fn();
const mockSetOutput = jest.fn();
const mockGetInput = jest.fn();
const mockFindOpenMilestoneDueTodayForGeneration = jest.fn();

let mockVersion = '';

jest.unstable_mockModule('@actions/core', () => ({
	setFailed: mockSetFailed,
	setOutput: mockSetOutput,
	getInput: mockGetInput,
	warning: jest.fn(),
	info: jest.fn()
}));

jest.unstable_mockModule('../src/get-todays-release-version/inputs.js', () => ({
	Inputs: class {
		get version() { return mockVersion; }
		get milestoneRepository() { return process.env.GITHUB_REPOSITORY; }
		get milestoneToken() { return 'token'; }
	}
}));

jest.unstable_mockModule('../src/milestones.js', () => ({
	Milestones: jest.fn().mockImplementation(() => ({
		findOpenMilestoneDueTodayForGeneration: mockFindOpenMilestoneDueTodayForGeneration
	}))
}));

const { run } = await import('../src/get-todays-release-version/index.js');

describe('get-todays-release-version', () => {
	beforeEach(() => {
		mockSetFailed.mockClear();
		mockSetOutput.mockClear();
		mockGetInput.mockClear();
		mockFindOpenMilestoneDueTodayForGeneration.mockClear();
		process.env.GITHUB_REPOSITORY = 'owner/repo';
		mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue(null);
		mockVersion = '';
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('when version ends in -SNAPSHOT', () => {
		it('finds a milestone due today for the generation', async () => {
			mockVersion = '6.2.0-SNAPSHOT';
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue({ name: '6.2.0-RC1' });
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '6.2.0-RC1');
		});

		it('returns empty when no milestone is due today', async () => {
			mockVersion = '6.2.0-SNAPSHOT';
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue(null);
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '');
		});
	});

	describe('when version ends in .x', () => {
		it('finds a milestone due today for the generation', async () => {
			mockVersion = '6.2.x';
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue({ name: '6.2.1' });
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '6.2.1');
		});

		it('returns empty when no milestone is due today', async () => {
			mockVersion = '6.2.x';
			mockFindOpenMilestoneDueTodayForGeneration.mockReturnValue(null);
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).toHaveBeenCalledWith({ major: 6, minor: 2 });
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '');
		});
	});

	describe('when version is not a snapshot', () => {
		it('returns empty for a GA version', async () => {
			mockVersion = '6.2.0';
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).not.toHaveBeenCalled();
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '');
		});

		it('returns empty for a pre-release version', async () => {
			mockVersion = '6.2.0-RC1';
			await run();
			expect(mockFindOpenMilestoneDueTodayForGeneration).not.toHaveBeenCalled();
			expect(mockSetOutput).toHaveBeenCalledWith('release-version', '');
		});
	});
});
