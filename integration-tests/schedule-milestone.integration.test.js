import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import * as core from '../__fixtures__/core.js';
import { run } from '../src/schedule-milestone/index.js';

vi.mock('@actions/core', async () => await import('../__fixtures__/core.js'));

const milestones = [];

const server = setupServer(
	http.get('https://api.github.com/repos/:owner/:repo/milestones', ({ request }) => {
		const state = new URL(request.url).searchParams.get('state') || 'open';
		const result = state === 'all' ? [...milestones] : milestones.filter((m) => m.state === state);
		return HttpResponse.json(result);
	}),
	http.patch('https://api.github.com/repos/:owner/:repo/milestones/:number', async ({ request, params }) => {
		const body = await request.json();
		const milestone = milestones.find((m) => m.number === parseInt(params.number));
		if (!milestone) {
			return new HttpResponse(null, { status: 404 });
		}
		Object.assign(milestone, body);
		return HttpResponse.json(milestone);
	}),
	http.post('https://api.github.com/repos/:owner/:repo/milestones', async ({ request }) => {
		const body = await request.json();
		const milestone = { number: milestones.length + 1, state: 'open', ...body };
		milestones.push(milestone);
		return HttpResponse.json(milestone, { status: 201 });
	}),
);

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

	beforeAll(() => {
		server.listen({ onUnhandledRequest: 'error' });
	});

	afterAll(() => server.close());

	beforeEach(() => {
		milestones.length = 0;
		milestones.push(...initialMilestones.map((m) => ({ ...m })));
	});

	afterEach(() => server.resetHandlers());

	it('creates a new milestone when it does not exist', async () => {
		await run({
			version: '2.0.0',
			versionDate: '2025-12-25',
			description: 'GA release',
			repository: 'owner/repo',
			token: 'test-token',
		});

		const created = milestones.find((m) => m.title === '2.0.0');
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

		const updated = milestones.find((m) => m.number === 1);
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

		const existing = milestones.find((m) => m.number === 1);
		expect(existing.due_on).toBe('2025-01-01T00:00:00Z');
		expect(existing.description).toBe('initial description');
	});
});
