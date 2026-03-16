import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { ReleaseBundle } from '../../src/distribute-release-bundle/release-bundle.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

const mockAxiosPost = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { post: mockAxiosPost } }));

const defaultInputs = {
	artifactoryUrl: 'https://usw1.packages.broadcom.com',
	bundleName: 'TNZ-spring-ldap',
	version: '3.5.0',
	buildName: 'spring-ldap-3.5.x',
	buildNumber: '42',
	username: 'user',
	password: 'pass',
};

describe('ReleaseBundle', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createUrl', () => {
		it('constructs the create URL', () => {
			const bundle = new ReleaseBundle(defaultInputs);
			expect(bundle.createUrl).toBe(
				'https://usw1.packages.broadcom.com/lifecycle/api/v2/release_bundle?project=spring&async=false',
			);
		});

		it('strips a trailing slash from artifactoryUrl', () => {
			const bundle = new ReleaseBundle({
				...defaultInputs,
				artifactoryUrl: 'https://usw1.packages.broadcom.com/',
			});
			expect(bundle.createUrl).toBe(
				'https://usw1.packages.broadcom.com/lifecycle/api/v2/release_bundle?project=spring&async=false',
			);
		});
	});

	describe('distributeUrl', () => {
		it('constructs the distribute URL', () => {
			const bundle = new ReleaseBundle(defaultInputs);
			expect(bundle.distributeUrl).toBe(
				'https://usw1.packages.broadcom.com/lifecycle/api/v2/distribution/distribute/TNZ-spring-ldap/3.5.0?project=spring',
			);
		});
	});

	describe('create', () => {
		it('posts to the create URL with the correct body and auth', async () => {
			mockAxiosPost.mockResolvedValue({ data: {} });
			const bundle = new ReleaseBundle(defaultInputs);
			await bundle.create();

			expect(mockAxiosPost).toHaveBeenCalledWith(
				bundle.createUrl,
				expect.objectContaining({
					release_bundle_name: 'TNZ-spring-ldap',
					release_bundle_version: '3.5.0',
					source_type: 'builds',
				}),
				expect.objectContaining({
					auth: { username: 'user', password: 'pass' },
					headers: { 'X-JFrog-Signing-Key-Name': 'packagesKey' },
				}),
			);
		});

		it('includes the build info in the source', async () => {
			mockAxiosPost.mockResolvedValue({ data: {} });
			const bundle = new ReleaseBundle(defaultInputs);
			await bundle.create();

			const body = mockAxiosPost.mock.calls[0][1];
			expect(body.source.builds[0]).toMatchObject({
				build_repository: 'spring-build-info',
				build_name: 'spring-ldap-3.5.x',
				build_number: '42',
				include_dependencies: false,
			});
		});

		it('logs the create URL', async () => {
			mockAxiosPost.mockResolvedValue({ data: {} });
			const bundle = new ReleaseBundle(defaultInputs);
			await bundle.create();

			expect(core.info).toHaveBeenCalledWith(
				expect.stringContaining(bundle.createUrl),
			);
		});
	});

	describe('distribute', () => {
		it('posts to the distribute URL with the correct body and auth', async () => {
			mockAxiosPost.mockResolvedValue({ data: {} });
			const bundle = new ReleaseBundle(defaultInputs);
			await bundle.distribute();

			expect(mockAxiosPost).toHaveBeenCalledWith(
				bundle.distributeUrl,
				expect.objectContaining({
					auto_create_missing_repositories: false,
					distribution_rules: [{ site_name: 'JP-SaaS' }],
				}),
				expect.objectContaining({
					auth: { username: 'user', password: 'pass' },
				}),
			);
		});

		it('returns the response data', async () => {
			mockAxiosPost.mockResolvedValue({ data: { ok: true } });
			const bundle = new ReleaseBundle(defaultInputs);
			const result = await bundle.distribute();

			expect(result).toEqual({ ok: true });
		});

		it('logs the distribute URL', async () => {
			mockAxiosPost.mockResolvedValue({ data: {} });
			const bundle = new ReleaseBundle(defaultInputs);
			await bundle.distribute();

			expect(core.info).toHaveBeenCalledWith(
				expect.stringContaining(bundle.distributeUrl),
			);
		});
	});
});
