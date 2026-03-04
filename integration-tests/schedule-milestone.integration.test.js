import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';
import { createMockGithubServer } from '../__fixtures__/github-server.js';

jest.unstable_mockModule('@actions/core', () => core);

const { run } = await import('../src/schedule-milestone/index.js');

describe('schedule-milestone integration', () => {
	const initialMilestones = [
		{
			number: 1,
			title: '1.0.0',
			state: 'open',
			due_on: '2025-01-01T00:00:00Z',
			description: 'initial description',
		},
	];

	let server;

	beforeAll(async () => {
		server = createMockGithubServer(initialMilestones);
		const port = await server.start();
		process.env.GITHUB_API_URL = `http://localhost:${port}`;
	});

	afterAll(async () => {
		delete process.env.GITHUB_API_URL;
		await server.stop();
	});

	beforeEach(() => {
		server.reset(initialMilestones);
	});

	it('creates a new milestone when it does not exist', async () => {
		await run({
			version: '2.0.0',
			versionDate: '2025-12-25',
			description: 'GA release',
			repository: 'owner/repo',
			token: 'test-token',
		});

		const created = server.getMilestones().find((m) => m.title === '2.0.0');
		expect(created).toBeDefined();
		expect(created.due_on).toBe('2025-12-25T00:00:00.000Z');
		expect(created.description).toBe('GA release');
		expect(created.state).toBe('open');
	});

	it('updates an existing milestone due date and description', async () => {
		await run({
			version: '1.0.0',
			versionDate: '2025-06-15',
			description: 'updated description',
			repository: 'owner/repo',
			token: 'test-token',
		});

		const updated = server.getMilestone(1);
		expect(updated.due_on).toBe('2025-06-15T00:00:00.000Z');
		expect(updated.description).toBe('updated description');
	});

	it('does not affect other milestones when creating a new one', async () => {
		await run({
			version: '3.0.0',
			versionDate: '2026-03-01',
			description: '',
			repository: 'owner/repo',
			token: 'test-token',
		});

		// The pre-existing milestone is untouched
		const existing = server.getMilestone(1);
		expect(existing.due_on).toBe('2025-01-01T00:00:00Z');
		expect(existing.description).toBe('initial description');
	});
});
