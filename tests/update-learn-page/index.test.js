import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { run, buildUpdatedPage } from '../../src/update-learn-page/index.js';
import { updateViaGithub } from '../../src/update-learn-page/github-strategy.js';
import { Version } from '../../src/versions.js';

const mockOctokit = vi.hoisted(() => vi.fn());

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

const mockUpdateViaApi = vi.hoisted(() => vi.fn());

vi.mock('../../src/update-learn-page/api-strategy.js', () => ({
	updateViaApi: mockUpdateViaApi
}));

vi.mock('@octokit/rest', () => ({
	Octokit: mockOctokit
}));

describe('Update Learn Page Action', () => {
	afterEach(() => mockUpdateViaApi.mockClear());

	const defaultInputs = {
		websiteToken: 'token',
		version: '1.2.3',
		projectName: 'spring-projects/spring-boot',
		websiteRepository: 'spring-io/spring-website-content',
		projectSlug: 'spring-boot',
		refDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
		apiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
		resolvedRefDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
		resolvedApiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
		isAntora: true
	};

	let octokit;

	beforeEach(() => {
		octokit = {
			repos: {
				getContent: vi.fn(),
				createOrUpdateFileContents: vi.fn()
			}
		};
		mockOctokit.mockImplementation(function() { return octokit; });
	});

	it('should fail for a commercial release without a website token', async () => {
		await run({ ...defaultInputs, commercial: true, websiteToken: '' });
		expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('commercial release needs a website-token'));
		expect(octokit.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
	});

	it('should update the Projects API for an OSS release, whatever the tokens', async () => {
		await run({ ...defaultInputs, commercial: false, websiteToken: 'token' });
		expect(mockUpdateViaApi).toHaveBeenCalledTimes(1);
		expect(octokit.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
	});

	it('should edit the website for a commercial release, and not the Projects API', async () => {
		octokit.repos.getContent.mockRejectedValue({ status: 404 });
		await run({ ...defaultInputs, commercial: true, websiteToken: 'token' });
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(1);
		expect(mockUpdateViaApi).not.toHaveBeenCalled();
	});

	it('should fail if the version is a SNAPSHOT', async () => {
		await run({ ...defaultInputs, version: '1.2.3-SNAPSHOT' });
		expect(core.setFailed).toHaveBeenCalledWith("Please specify a non-SNAPSHOT release version to publish; it's accompanying SNAPSHOT version will also be published");
	});

	it('should create a new documentation file', async () => {
		octokit.repos.getContent.mockRejectedValue({ status: 404 });
		await updateViaGithub(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		expect(call.owner).toBe('spring-io');
		expect(call.repo).toBe('spring-website-content');
		expect(call.path).toBe('project/spring-boot/documentation.json');
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(2);
		expect(content[0].version).toBe('1.2.4-SNAPSHOT');
		expect(content[1].version).toBe('1.2.3');
		expect(content[1].ref).toBe('https://docs.spring.io/spring-boot/reference/{version}/index.html');
	});

	it('should update an existing documentation file', async () => {
		const existing = [
			{ version: '1.1.0', status: 'GENERAL_AVAILABILITY', current: false },
			{ version: '1.2.2', status: 'GENERAL_AVAILABILITY', current: true },
			{ version: '1.2.3-SNAPSHOT', status: 'SNAPSHOT', current: false }
		];
		const existingContent = Buffer.from(JSON.stringify(existing)).toString('base64');
		octokit.repos.getContent.mockResolvedValue({ data: { content: existingContent, sha: 'sha' } });
		await updateViaGithub(defaultInputs);
		expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalled();
		const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0];
		const content = JSON.parse(Buffer.from(call.content, 'base64').toString());
		expect(content.length).toBe(3);
		expect(content[0].version).toBe('1.2.4-SNAPSHOT');
		expect(content[1].version).toBe('1.2.3');
		expect(content[2].version).toBe('1.1.0');
	});
});

describe('buildUpdatedPage', () => {
	const refDocUrl = 'https://docs.spring.io/spring-boot/reference/{version}/index.html';
	const apiDocUrl = 'https://docs.spring.io/spring-boot/site/docs/{version}/api/';
	const version = new Version('1.2.3');

	describe('OSS (non-commercial)', () => {
		it('creates snapshot and GA entries when no existing page', () => {
			const result = JSON.parse(buildUpdatedPage(null, version, true, refDocUrl, apiDocUrl, false));
			expect(result).toHaveLength(2);
			expect(result[0].version).toBe('1.2.4-SNAPSHOT');
			expect(result[1].version).toBe('1.2.3');
		});

		it('prepends snapshot and GA, removes same-generation entries', () => {
			const existing = [
				{ version: '1.1.0', status: 'GENERAL_AVAILABILITY', current: false },
				{ version: '1.2.2', status: 'GENERAL_AVAILABILITY', current: true },
				{ version: '1.2.3-SNAPSHOT', status: 'SNAPSHOT', current: false },
			];
			const result = JSON.parse(buildUpdatedPage(JSON.stringify(existing), version, true, refDocUrl, apiDocUrl, false));
			expect(result).toHaveLength(3);
			expect(result[0].version).toBe('1.2.4-SNAPSHOT');
			expect(result[1].version).toBe('1.2.3');
			expect(result[2].version).toBe('1.1.0');
		});

		it('creates four-digit snapshot and GA entries for a four-digit version', () => {
			const fourDigit = new Version('6.5.0.1');
			const result = JSON.parse(buildUpdatedPage(null, fourDigit, true, refDocUrl, apiDocUrl, false));
			expect(result).toHaveLength(2);
			expect(result[0].version).toBe('6.5.0.2-SNAPSHOT');
			expect(result[1].version).toBe('6.5.0.1');
		});
	});

	describe('commercial', () => {
		it('creates a single GA entry when no existing page', () => {
			const result = JSON.parse(buildUpdatedPage(null, version, true, refDocUrl, apiDocUrl, true));
			expect(result).toHaveLength(1);
			expect(result[0].version).toBe('1.2.3');
		});

		const enterprise = (generation, path) =>
			`https://docs.enterprise.spring.io/spring-security/reference/${generation ? generation + '/' : ''}${path}`;
		const entry = (version, generation, current = false) => ({
			version,
			api: enterprise(generation, 'api/java/index.html'),
			ref: enterprise(generation, 'index.html'),
			status: 'GENERAL_AVAILABILITY',
			current
		});
		const ref = enterprise('{major.minor}', 'index.html');
		const api = enterprise('{major.minor}', 'api/java/index.html');
		const commercial = (existing, newVersion) =>
			JSON.parse(buildUpdatedPage(JSON.stringify(existing), new Version(newVersion), true, ref, api, true));

		it('omits the antora flag and the directory of the generation when it is the only one', () => {
			expect(commercial([], '7.0.6.1')).toEqual([entry('7.0.6.1', '', true)]);
		});

		it('keeps the directory out of the URLs of a version of the newest generation', () => {
			const result = commercial([entry('7.1.0.1', '', true), entry('7.0.8.1', '7.0')], '7.1.2.1');
			expect(result).toEqual([entry('7.1.2.1', '', true), entry('7.1.0.1', ''), entry('7.0.8.1', '7.0')]);
		});

		it('puts the directory back into the URLs of a generation that a newer one replaces', () => {
			const result = commercial([entry('7.1.2.1', '', true), entry('7.1.0.1', ''), entry('7.0.8.1', '7.0')], '7.2.0.1');
			expect(result).toEqual([
				entry('7.2.0.1', '', true),
				entry('7.1.2.1', '7.1'),
				entry('7.1.0.1', '7.1'),
				entry('7.0.8.1', '7.0')
			]);
		});

		it('gives a version of an older generation its directory and leaves the newest as it is', () => {
			const result = commercial([entry('7.1.2.1', '', true), entry('7.0.8.1', '7.0')], '7.0.9.1');
			expect(result).toEqual([entry('7.1.2.1', '', true), entry('7.0.9.1', '7.0'), entry('7.0.8.1', '7.0')]);
		});

		it('does not touch URLs that were set by hand', () => {
			const legacy = {
				...entry('7.0.5.1', '7.0'),
				api: 'https://docs.enterprise.spring.io/spring-security/docs/{version}/api/index.html'
			};
			const result = commercial([legacy], '7.1.0.1');
			expect(result.find((e) => e.version === '7.0.5.1')).toEqual({ ...legacy, current: false });
		});

		it('prepends GA without adding a snapshot entry', () => {
			const existing = [
				{ version: '1.1.0', status: 'GENERAL_AVAILABILITY', current: false },
				{ version: '1.2.2', status: 'GENERAL_AVAILABILITY', current: true },
			];
			const result = JSON.parse(buildUpdatedPage(JSON.stringify(existing), version, true, refDocUrl, apiDocUrl, true));
			expect(result).toHaveLength(3);
			expect(result[0].version).toBe('1.2.3');
			expect(result[1].version).toBe('1.2.2');
			expect(result[2].version).toBe('1.1.0');
		});
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
		resolvedRefDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
		resolvedApiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
		isAntora: true,
		commercial: true
	};

	let octokit;

	beforeEach(() => {
		octokit = {
			repos: {
				getContent: vi.fn(),
				createOrUpdateFileContents: vi.fn()
			}
		};
		mockOctokit.mockImplementation(function() { return octokit; });
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
		expect(content[0].ref).toBe('https://docs.spring.io/spring-boot/reference/{version}/index.html');
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
