import { vi } from 'vitest';
import { Milestones } from '../src/milestones.js';

const { mockListMilestones, mockUpdateMilestone, mockCreateMilestone, mockPaginate, mockOctokit } = vi.hoisted(() => {
	const mockListMilestones = vi.fn();
	const mockUpdateMilestone = vi.fn();
	const mockCreateMilestone = vi.fn();
	const mockPaginate = vi.fn(async (endpoint, params) => {
		const response = await endpoint(params);
		return response.data;
	});
	const mockOctokit = vi.fn(function() { return {
		rest: {
			issues: {
				listMilestones: mockListMilestones,
				updateMilestone: mockUpdateMilestone,
				createMilestone: mockCreateMilestone
			}
		},
		paginate: mockPaginate
	}; });
	return { mockListMilestones, mockUpdateMilestone, mockCreateMilestone, mockPaginate, mockOctokit };
});

vi.mock('@octokit/rest', () => ({
	Octokit: mockOctokit
}));

describe('Milestones', () => {
	let milestones;

	beforeEach(() => {
		milestones = new Milestones('token', 'owner/repo');
	});

	describe('closeMilestone', () => {
		it('closes a milestone', async () => {
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue({number: 1});
			await milestones.closeMilestone('title');
			expect(mockUpdateMilestone).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				milestone_number: 1,
				state: 'closed'
			});
		});

		it('does nothing if milestone not found', async () => {
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue(null);
			await milestones.closeMilestone('title');
			expect(mockUpdateMilestone).not.toHaveBeenCalled();
		});
	});

	describe('scheduleMilestone', () => {
		it('updates an existing milestone', async () => {
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue({number: 1});
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
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue(null);
			await milestones.scheduleMilestone('title', '2025-12-25', 'description');
			expect(mockCreateMilestone).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				title: 'title',
				due_on: '2025-12-25T00:00:00.000Z',
				description: 'description'
			});
		});

		it('updates an existing milestone without a due date when none is given', async () => {
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue({number: 1});
			await milestones.scheduleMilestone('title', undefined, 'description');
			expect(mockUpdateMilestone).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				milestone_number: 1,
				description: 'description'
			});
		});

		it('creates a new milestone without a due date when none is given', async () => {
			milestones.findMilestoneByTitle = vi.fn().mockResolvedValue(null);
			await milestones.scheduleMilestone('title', undefined, 'description');
			expect(mockCreateMilestone).toHaveBeenCalledWith({
				owner: 'owner',
				repo: 'repo',
				title: 'title',
				description: 'description'
			});
		});
	});

	describe('findNextOpenMilestoneForGeneration', () => {
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
			const milestone = await milestones.findNextOpenMilestoneForGeneration({ major: 1, minor: 2});
			expect(milestone.name).toBe("1.2.3-M3");
		});

		it('finds a milestone due in the future when none are due today', async() => {
			const today = new Date();
			const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
			const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
			mockListMilestones.mockResolvedValue({
				data: [
					{
						title: '1.1.4',
						number: 4,
						due_on: nextYear.toISOString()
					},
					{
						title: '1.2.3-M3',
						number: 1,
						due_on: nextMonth.toISOString()
					},
					{
						title: '1.2.3-RC1',
						number: 2,
						due_on: nextYear.toISOString()
					},
				]});
			const milestone = await milestones.findNextOpenMilestoneForGeneration({ major: 1, minor: 2});
			expect(milestone.name).toBe("1.2.3-M3");
		});

		it('finds no milestone when all are in the past', async() => {
			const today = new Date();
			const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
			mockListMilestones.mockResolvedValue({
				data: [
					{
						title: '1.2.3',
						number: 3,
						due_on: lastYear.toISOString()
					},
					{
						title: '1.2.3-RC1',
						number: 2,
						due_on: lastYear.toISOString()
					},
				]});
			const milestone = await milestones.findNextOpenMilestoneForGeneration({ major: 1, minor: 2});
			expect(milestone).toBe(null);
		});

		it('orders four-digit milestones correctly when due on the same date', async() => {
			const today = new Date();
			mockListMilestones.mockResolvedValue({
				data: [
					{
						title: '6.5.0.2',
						number: 2,
						due_on: today.toISOString()
					},
					{
						title: '6.5.0.1',
						number: 1,
						due_on: today.toISOString()
					},
					{
						title: '6.5.0.10',
						number: 10,
						due_on: today.toISOString()
					},
				]});
			const milestone = await milestones.findNextOpenMilestoneForGeneration({ major: 6, minor: 5});
			expect(milestone.name).toBe("6.5.0.1");
		});
	})

	describe('findClosedMilestonesDueWithin', () => {
		it('finds closed milestones due within the given month and year', async () => {
			mockListMilestones.mockResolvedValue({
				data: [
					{ title: '1.0.1', number: 1, due_on: '2026-08-05T00:00:00Z' },
					{ title: '1.1.0-M1', number: 2, due_on: '2026-08-20T00:00:00Z' },
					{ title: '1.0.2', number: 3, due_on: '2026-09-01T00:00:00Z' },
					{ title: '1.0.0', number: 4, due_on: '2025-08-05T00:00:00Z' },
				]
			});
			const found = await milestones.findClosedMilestonesDueWithin(2026, 8);
			expect(found.map((m) => m.name)).toEqual(['1.0.1', '1.1.0-M1']);
			expect(mockListMilestones).toHaveBeenCalledWith(
				expect.objectContaining({ owner: 'owner', repo: 'repo', state: 'closed' }),
			);
		});

		it('sorts results by version', async () => {
			mockListMilestones.mockResolvedValue({
				data: [
					{ title: '1.1.0', number: 1, due_on: '2026-08-05T00:00:00Z' },
					{ title: '1.0.5', number: 2, due_on: '2026-08-10T00:00:00Z' },
				]
			});
			const found = await milestones.findClosedMilestonesDueWithin(2026, 8);
			expect(found.map((m) => m.name)).toEqual(['1.0.5', '1.1.0']);
		});

		it('ignores milestones whose titles are not versions', async () => {
			mockListMilestones.mockResolvedValue({
				data: [
					{ title: 'Backlog', number: 1, due_on: '2026-08-05T00:00:00Z' },
					{ title: '1.0.1', number: 2, due_on: '2026-08-06T00:00:00Z' },
				]
			});
			const found = await milestones.findClosedMilestonesDueWithin(2026, 8);
			expect(found.map((m) => m.name)).toEqual(['1.0.1']);
		});

		it('returns an empty array when nothing is due in that month', async () => {
			mockListMilestones.mockResolvedValue({
				data: [
					{ title: '1.0.1', number: 1, due_on: '2026-07-05T00:00:00Z' },
				]
			});
			const found = await milestones.findClosedMilestonesDueWithin(2026, 8);
			expect(found).toEqual([]);
		});

		it('ignores milestones without a due date', async () => {
			mockListMilestones.mockResolvedValue({
				data: [
					{ title: '1.0.1', number: 1, due_on: null },
				]
			});
			const found = await milestones.findClosedMilestonesDueWithin(2026, 8);
			expect(found).toEqual([]);
		});
	});
});
