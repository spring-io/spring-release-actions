import { jest } from '@jest/globals';
import * as core from '../__fixtures__/core.js';

const mockOctokit = jest.fn();

jest.unstable_mockModule('@actions/core', () => core);

jest.unstable_mockModule('@octokit/rest', () => ({
	Octokit: mockOctokit
}));

const { run } = await import('../src/update-learn-page/index.js');

describe('Update Learn Page Action', () => {
	const defaultInputs = {
		websiteToken: 'token',
		version: '1.2.3',
		projectName: 'spring-projects/spring-boot',
		websiteRepository: 'spring-io/spring-website-content',
		projectSlug: 'spring-boot',
		refDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
		apiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
		isAntora: true
	};

	let octokit;

	beforeEach(() => {
		octokit = {
			repos: {
				getContent: jest.fn(),
				createOrUpdateFileContents: jest.fn()
			}
		};
		mockOctokit.mockImplementation(() => octokit);
	});

	it('should fail if the version is a SNAPSHOT', async () => {
		await run({ ...defaultInputs, version: '1.2.3-SNAPSHOT' });
		expect(core.setFailed).toHaveBeenCalledWith("Please specify a non-SNAPSHOT release version to publish; it's accompanying SNAPSHOT version will also be published");
	});

	it('should create a new documentation file', async () => {
		octokit.repos.getContent.mockRejectedValue({ status: 404 });
		await run(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		expect(call.owner).toBe('spring-io');
		expect(call.repo).toBe('spring-website-content');
		expect(call.path).toBe('project/spring-boot/documentation.json');
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(2);
		expect(content[0].version).toBe('1.2.4-SNAPSHOT');
		expect(content[1].version).toBe('1.2.3');
		expect(content[1].referenceDocUrl).toBe('https://docs.spring.io/spring-boot/reference/{version}/index.html');
	});

	it('should update an existing documentation file', async () => {
		const existing = [
			{ version: '1.1.0', status: 'GENERAL_AVAILABILITY', current: false },
			{ version: '1.2.2', status: 'GENERAL_AVAILABILITY', current: true },
			{ version: '1.2.3-SNAPSHOT', status: 'SNAPSHOT', current: false }
		];
		const existingContent = Buffer.from(JSON.stringify(existing)).toString('base64');
		octokit.repos.getContent.mockResolvedValue({ data: { content: existingContent, sha: 'sha' } });
		await run(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(3);
		expect(content[0].version).toBe('1.2.4-SNAPSHOT');
		expect(content[1].version).toBe('1.2.3');
		expect(content[2].version).toBe('1.1.0');
	});
});

describe('Update Learn Page Action Commercial', () => {
	const defaultInputs = {
		websiteToken: 'token',
		version: '1.2.3',
		projectName: 'spring-projects/spring-boot-commercial',
		websiteRepository: 'spring-io/spring-website-content-commercial',
		projectSlug: 'spring-boot',
		refDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
		apiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
		isAntora: true,
		commercial: true
	};

	let octokit;

	beforeEach(() => {
		octokit = {
			repos: {
				getContent: jest.fn(),
				createOrUpdateFileContents: jest.fn()
			}
		};
		mockOctokit.mockImplementation(() => octokit);
	});

	it('should fail if the version is a SNAPSHOT', async () => {
		await run({ ...defaultInputs, version: '1.2.3-SNAPSHOT' });
		expect(core.setFailed).toHaveBeenCalledWith("Please specify a non-SNAPSHOT release version to publish; it's accompanying SNAPSHOT version will also be published");
	});

	it('should create a new documentation file', async () => {
		octokit.repos.getContent.mockRejectedValue({ status: 404 });
		await run(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		expect(call.owner).toBe('spring-io');
		expect(call.repo).toBe('spring-website-content-commercial');
		expect(call.path).toBe('project/spring-boot/documentation.json');
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(1);
		expect(content[0].version).toBe('1.2.3');
		expect(content[0].referenceDocUrl).toBe('https://docs.spring.io/spring-boot/reference/{version}/index.html');
	});

	it('should update an existing documentation file', async () => {
		const existing = [
			{ version: '1.1.0', status: 'GENERAL_AVAILABILITY', current: false },
			{ version: '1.2.2', status: 'GENERAL_AVAILABILITY', current: true }
		];
		const existingContent = Buffer.from(JSON.stringify(existing)).toString('base64');
		octokit.repos.getContent.mockResolvedValue({ data: { content: existingContent, sha: 'sha' } });
		await run(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(3);
		expect(content[0].version).toBe('1.2.3');
		expect(content[1].version).toBe('1.2.2');
		expect(content[2].version).toBe('1.1.0');
	});
});
