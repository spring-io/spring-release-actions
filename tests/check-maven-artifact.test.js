import { jest } from '@jest/globals';

const mockSetFailed = jest.fn();
const mockSetOutput = jest.fn();
const mockInfo = jest.fn();
const mockInputs = jest.fn();

jest.unstable_mockModule('@actions/core', () => ({
	setFailed: mockSetFailed,
	setOutput: mockSetOutput,
	info: mockInfo
}));

jest.unstable_mockModule('../src/check-maven-artifact/inputs.js', () => ({
	Inputs: mockInputs
}));

const { MavenArtifact } = await import('../src/maven.js');
const { default: run } = await import('../src/check-maven-artifact/index.js');

describe('check-maven-artifact', () => {
	let existsSpy;
	let waitForSpy;

	const defaultInputs = {
		repositoryUrl: 'https://repo1.maven.org/maven2',
		artifactPath: 'org/springframework/spring-core',
		version: '6.1.0',
		username: '',
		password: '',
		timeout: 0
	};

	beforeEach(() => {
		mockSetFailed.mockClear();
		mockSetOutput.mockClear();
		mockInfo.mockClear();
		mockInputs.mockClear();
		existsSpy = jest.spyOn(MavenArtifact.prototype, 'exists');
		waitForSpy = jest.spyOn(MavenArtifact.prototype, 'waitFor');
		mockInputs.mockImplementation(() => ({ ...defaultInputs }));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reports found and sets output when artifact exists', async () => {
		existsSpy.mockResolvedValue(true);
		await run();
		expect(mockSetOutput).toHaveBeenCalledWith('found', true);
		expect(mockSetFailed).not.toHaveBeenCalled();
	});

	it('reports not found and fails when artifact does not exist', async () => {
		existsSpy.mockResolvedValue(false);
		await run();
		expect(mockSetOutput).toHaveBeenCalledWith('found', false);
		expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Artifact not found'));
	});

	it('calls exists (not waitFor) when timeout is 0', async () => {
		existsSpy.mockResolvedValue(true);
		mockInputs.mockImplementation(() => ({ ...defaultInputs, timeout: 0 }));
		await run();
		expect(existsSpy).toHaveBeenCalled();
		expect(waitForSpy).not.toHaveBeenCalled();
	});

	it('calls waitFor when a timeout is provided', async () => {
		waitForSpy.mockResolvedValue(true);
		mockInputs.mockImplementation(() => ({ ...defaultInputs, timeout: 5 }));
		await run();
		expect(waitForSpy).toHaveBeenCalledWith(5);
		expect(existsSpy).not.toHaveBeenCalled();
		expect(mockSetOutput).toHaveBeenCalledWith('found', true);
	});

	it('sets failed and outputs false when waitFor times out', async () => {
		waitForSpy.mockResolvedValue(false);
		mockInputs.mockImplementation(() => ({ ...defaultInputs, timeout: 5 }));
		await run();
		expect(mockSetOutput).toHaveBeenCalledWith('found', false);
		expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Artifact not found'));
	});

	it('handles unexpected errors', async () => {
		existsSpy.mockRejectedValue(new Error('Network Error'));
		await run();
		expect(mockSetFailed).toHaveBeenCalledWith('Network Error');
	});

	it('constructs the artifact url from inputs', async () => {
		existsSpy.mockResolvedValue(true);
		mockInputs.mockImplementation(() => ({
			...defaultInputs,
			repositoryUrl: 'https://my.repo.example.com/maven2',
			artifactPath: 'com/example/my-artifact',
			version: '1.2.3'
		}));
		await run();
		expect(existsSpy).toHaveBeenCalled();
		const artifact = existsSpy.mock.instances[0];
		expect(artifact.url).toBe(
			'https://my.repo.example.com/maven2/com/example/my-artifact/1.2.3/'
		);
	});
});
