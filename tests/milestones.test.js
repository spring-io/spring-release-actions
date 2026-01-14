const { Milestones } = require('../src/milestones');

jest.mock('@octokit/rest');

const {Octokit} = require('@octokit/rest');

describe('Milestones', () => {
    let milestones;
	let mockListMilestones;
    let mockUpdateMilestone;
    let mockCreateMilestone;

    beforeEach(() => {
        process.env.GITHUB_REPOSITORY = 'owner/repo';
		mockListMilestones = jest.fn();
        mockUpdateMilestone = jest.fn();
        mockCreateMilestone = jest.fn();
        Octokit.mockImplementation(() => {
            return {
                rest: {
                    issues: {
						listMilestones: mockListMilestones,
                        updateMilestone: mockUpdateMilestone,
                        createMilestone: mockCreateMilestone
                    }
                }
            };
        });
        milestones = new Milestones('token', process.env.GITHUB_REPOSITORY);
        jest.clearAllMocks();
    });

    describe('closeMilestone', () => {
        it('closes a milestone', async () => {
            milestones.findMilestoneByTitle = jest.fn().mockResolvedValue({number: 1});
            await milestones.closeMilestone('title');
            expect(mockUpdateMilestone).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                milestone_number: 1,
                state: 'closed'
            });
        });

        it('does nothing if milestone not found', async () => {
            milestones.findMilestoneByTitle = jest.fn().mockResolvedValue(null);
            await milestones.closeMilestone('title');
            expect(mockUpdateMilestone).not.toHaveBeenCalled();
        });
    });

    describe('scheduleMilestone', () => {
        it('updates an existing milestone', async () => {
            milestones.findMilestoneByTitle = jest.fn().mockResolvedValue({number: 1});
            await milestones.scheduleMilestone('title', '2025-12-25', 'description');
            expect(mockUpdateMilestone).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                milestone_number: 1,
                due_on: '2025-12-25T00:00:00.000Z',
                description: 'description'
            });
        });

        it('creates a new milestone', async () => {
            milestones.findMilestoneByTitle = jest.fn().mockResolvedValue(null);
            await milestones.scheduleMilestone('title', '2025-12-25', 'description');
            expect(mockCreateMilestone).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                title: 'title',
                due_on: '2025-12-25T00:00:00.000Z',
                description: 'description'
            });
        });
    });

	describe('findEarliestOpenMilestoneByGeneration', () => {
		it('finds milestone due today', async() => {
			const today = new Date();
			const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
			mockListMilestones.mockResolvedValue({
				data: [
				{
					title: '1.1.4',
					number: 4,
					due_on: today.toISOString()
				},
				{
					title: '1.2.3',
					number: 3,
					due_on: nextYear.toISOString()
				},
				{
					title: '1.2.3-M3',
					number: 1,
					due_on: today.toISOString()
				},
				{
					title: '1.2.3-RC1',
					number: 2,
					due_on: nextYear.toISOString()
				},
			]});
			const milestone = await milestones.findOpenMilestoneDueTodayForGeneration({ major: 1, minor: 2});
			expect(milestone.name).toBe("1.2.3-M3");
		});

		it('finds no milestone due today', async() => {
			const today = new Date();
			const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
			mockListMilestones.mockResolvedValue({
				data: [
					{
						title: '1.1.4',
						number: 4,
						due_on: today.toISOString()
					},
					{
						title: '1.2.3',
						number: 3,
						due_on: nextYear.toISOString()
					},
					{
						title: '1.2.3-RC1',
						number: 2,
						due_on: nextYear.toISOString()
					},
				]});
			const milestone = await milestones.findOpenMilestoneDueTodayForGeneration({ major: 1, minor: 2});
			expect(milestone).toBe(null);
		});
	})
});
