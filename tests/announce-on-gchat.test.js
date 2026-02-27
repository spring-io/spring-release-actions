import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

const mockInputs = jest.fn();

jest.unstable_mockModule('@actions/core', () => core);

jest.unstable_mockModule('../src/announce-on-gchat/inputs.js', () => ({
	Inputs: mockInputs
}));

const { Announce } = await import('../src/gchat.js');
const { run } = await import('../src/announce-on-gchat/index.js');

describe('announce-on-gchat', () => {
	let announceReleaseSpy;

	beforeEach(() => {
		process.env.GITHUB_REPOSITORY = 'owner/repo';
		announceReleaseSpy = jest.spyOn(Announce.prototype, 'announceRelease').mockResolvedValue();
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: '',
			version: '',
			projectName: process.env.GITHUB_REPOSITORY.split('/')[1]
		}));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('announces a release', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: '1.2.3',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		await run();
		expect(announceReleaseSpy).toHaveBeenCalledWith('1.2.3');
	});

	it('uses project-name', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: '1.2.3',
			projectName: 'project'
		}));
		await run();
		expect(announceReleaseSpy).toHaveBeenCalledWith('1.2.3');
	});

	it('handles errors', async () => {
		mockInputs.mockImplementation(() => ({
			gchatWebhookUrl: 'https://example.com',
			version: '1.2.3',
			get projectName() {
				return process.env.GITHUB_REPOSITORY.split('/')[1];
			}
		}));
		announceReleaseSpy.mockRejectedValue(new Error('error'));
		await run();
		expect(core.setFailed).toHaveBeenCalledWith('error');
	});
});
