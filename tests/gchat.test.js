const axios = require('axios');
const { Announce } = require('../src/gchat');

jest.mock('axios');

describe('gchat', () => {
	it('postMessage posts', async () => {
		const announce = new Announce('https://example.com', 'repo');
		await announce.announceRelease('1.2.3');
		expect(axios.post).toHaveBeenCalledWith('https://example.com', { text: 'repo-announcing `1.2.3` is available now' });
	});
});
