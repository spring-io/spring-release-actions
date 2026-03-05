import { vi } from 'vitest';
import { Announce } from '../src/gchat.js';

const mockPost = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
	default: {
		post: mockPost
	}
}));

describe('gchat', () => {
	beforeEach(() => {
		mockPost.mockClear();
	});

	it('postMessage posts', async () => {
		const announce = new Announce('https://example.com', 'repo');
		await announce.announceRelease('1.2.3');
		expect(mockPost).toHaveBeenCalledWith('https://example.com', { text: 'repo-announcing `1.2.3` is available now' });
	});
});
