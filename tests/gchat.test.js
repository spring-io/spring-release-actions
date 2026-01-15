import { jest } from '@jest/globals';

const mockPost = jest.fn();

jest.unstable_mockModule('axios', () => ({
	default: {
		post: mockPost
	}
}));

const { Announce } = await import('../src/gchat.js');

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
