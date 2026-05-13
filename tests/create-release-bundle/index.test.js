import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { ReleaseBundle } from '../../src/create-release-bundle/release-bundle.js';
import { run } from '../../src/create-release-bundle/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('create-release-bundle', () => {
	const defaultInputs = {
		artifactoryUrl: 'https://usw1.packages.broadcom.com',
		bundleName: 'TNZ-spring-ldap',
		version: '3.5.0',
		buildName: 'spring-ldap-3.5.x',
		buildNumber: '42',
		username: 'user',
		password: 'pass',
	};

	let createSpy;

	beforeEach(() => {
		createSpy = vi.spyOn(ReleaseBundle.prototype, 'create').mockResolvedValue();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('creates the release bundle', async () => {
		await run(defaultInputs);

		expect(createSpy).toHaveBeenCalled();
		expect(core.setFailed).not.toHaveBeenCalled();
	});

	it('calls setFailed when create throws', async () => {
		createSpy.mockRejectedValue(new Error('create failed'));

		await run(defaultInputs);

		expect(core.setFailed).toHaveBeenCalledWith('create failed');
	});
});
