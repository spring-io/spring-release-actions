import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { Inputs } from '../../src/distribute-release-bundle/inputs.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

function setupGetInput(map) {
	core.getInput.mockImplementation((name) => map[name] ?? '');
}

describe('distribute-release-bundle Inputs constructor', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('reads all required inputs', () => {
		setupGetInput({
			'artifactory-url': 'https://usw1.packages.broadcom.com',
			'bundle-name': 'TNZ-spring-ldap',
			'version': '3.5.0',
			'build-name': 'spring-ldap-3.5.x',
			'build-number': '42',
			'username': 'user',
			'password': 'pass',
		});

		const inputs = new Inputs();

		expect(inputs.artifactoryUrl).toBe('https://usw1.packages.broadcom.com');
		expect(inputs.bundleName).toBe('TNZ-spring-ldap');
		expect(inputs.version).toBe('3.5.0');
		expect(inputs.buildName).toBe('spring-ldap-3.5.x');
		expect(inputs.buildNumber).toBe('42');
		expect(inputs.username).toBe('user');
		expect(inputs.password).toBe('pass');
		expect(Object.isFrozen(inputs)).toBe(true);
	});
});
