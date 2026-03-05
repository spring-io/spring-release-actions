import { vi } from 'vitest';
import * as core from '../../__fixtures__/core.js';
import { MavenArtifact } from '../../src/maven.js';
import { run } from '../../src/check-maven-artifact/index.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

describe('check-maven-artifact', () => {
	const defaultInputs = {
		repositoryUrl: 'https://repo1.maven.org/maven2',
		artifactPath: 'org/springframework/spring-core',
		version: '6.1.0',
		username: '',
		password: '',
		timeout: 0
	};

	let existsSpy;
	let waitForSpy;

	beforeEach(() => {
		existsSpy = vi.spyOn(MavenArtifact.prototype, 'exists');
		waitForSpy = vi.spyOn(MavenArtifact.prototype, 'waitFor');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('reports found and sets output when artifact exists', async () => {
		existsSpy.mockResolvedValue(true);
		await run(defaultInputs);
		expect(core.setOutput).toHaveBeenCalledWith('found', true);
		expect(core.setFailed).not.toHaveBeenCalled();
	});

	it('reports not found and fails when artifact does not exist', async () => {
		existsSpy.mockResolvedValue(false);
		await run(defaultInputs);
		expect(core.setOutput).toHaveBeenCalledWith('found', false);
		expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Artifact not found'));
	});

	it('calls exists (not waitFor) when timeout is 0', async () => {
		existsSpy.mockResolvedValue(true);
		await run(defaultInputs);
		expect(existsSpy).toHaveBeenCalled();
		expect(waitForSpy).not.toHaveBeenCalled();
	});

	it('calls waitFor when a timeout is provided', async () => {
		waitForSpy.mockResolvedValue(true);
		await run({ ...defaultInputs, timeout: 5 });
		expect(waitForSpy).toHaveBeenCalledWith(5);
		expect(existsSpy).not.toHaveBeenCalled();
		expect(core.setOutput).toHaveBeenCalledWith('found', true);
	});

	it('sets failed and outputs false when waitFor times out', async () => {
		waitForSpy.mockResolvedValue(false);
		await run({ ...defaultInputs, timeout: 5 });
		expect(core.setOutput).toHaveBeenCalledWith('found', false);
		expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Artifact not found'));
	});

	it('handles unexpected errors', async () => {
		existsSpy.mockRejectedValue(new Error('Network Error'));
		await run(defaultInputs);
		expect(core.setFailed).toHaveBeenCalledWith('Network Error');
	});

	it('constructs the artifact url from inputs', async () => {
		existsSpy.mockResolvedValue(true);
		await run({
			...defaultInputs,
			repositoryUrl: 'https://my.repo.example.com/maven2',
			artifactPath: 'com/example/my-artifact',
			version: '1.2.3'
		});
		expect(existsSpy).toHaveBeenCalled();
		const artifact = existsSpy.mock.instances[0];
		expect(artifact.url).toBe(
			'https://my.repo.example.com/maven2/com/example/my-artifact/1.2.3/'
		);
	});
});
