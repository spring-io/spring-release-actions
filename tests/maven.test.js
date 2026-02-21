import { jest } from '@jest/globals';

const mockAxiosHead = jest.fn();

jest.unstable_mockModule('axios', () => ({
	default: { head: mockAxiosHead }
}));

const { MavenArtifact } = await import('../src/maven.js');

describe('MavenArtifact', () => {
	const repositoryUrl = 'https://repo1.maven.org/maven2';
	const artifactPath = 'org/springframework/spring-core';
	const version = '6.1.0';

	beforeEach(() => {
		mockAxiosHead.mockClear();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('url', () => {
		it('constructs the version directory url', () => {
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			expect(artifact.url).toBe(
				'https://repo1.maven.org/maven2/org/springframework/spring-core/6.1.0/'
			);
		});

		it('strips a trailing slash from the repository url', () => {
			const artifact = new MavenArtifact(repositoryUrl + '/', artifactPath, version);
			expect(artifact.url).toBe(
				'https://repo1.maven.org/maven2/org/springframework/spring-core/6.1.0/'
			);
		});

		it('strips a leading slash from the artifact path', () => {
			const artifact = new MavenArtifact(repositoryUrl, '/' + artifactPath, version);
			expect(artifact.url).toBe(
				'https://repo1.maven.org/maven2/org/springframework/spring-core/6.1.0/'
			);
		});
	});

	describe('exists', () => {
		it('returns true when the server responds with 200', async () => {
			mockAxiosHead.mockResolvedValue({ status: 200 });
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			expect(await artifact.exists()).toBe(true);
			expect(mockAxiosHead).toHaveBeenCalledWith(artifact.url, {});
		});

		it('returns false when the server responds with 404', async () => {
			const error = new Error('Not Found');
			error.response = { status: 404 };
			mockAxiosHead.mockRejectedValue(error);
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			expect(await artifact.exists()).toBe(false);
		});

		it('throws when the server responds with an unexpected error', async () => {
			const error = new Error('Internal Server Error');
			error.response = { status: 500 };
			mockAxiosHead.mockRejectedValue(error);
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			await expect(artifact.exists()).rejects.toThrow('Internal Server Error');
		});

		it('throws on network error', async () => {
			mockAxiosHead.mockRejectedValue(new Error('Network Error'));
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			await expect(artifact.exists()).rejects.toThrow('Network Error');
		});

		it('passes basic auth when username and password are provided', async () => {
			mockAxiosHead.mockResolvedValue({ status: 200 });
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version, 'user', 'pass');
			await artifact.exists();
			expect(mockAxiosHead).toHaveBeenCalledWith(artifact.url, {
				auth: { username: 'user', password: 'pass' }
			});
		});

		it('omits auth when credentials are empty', async () => {
			mockAxiosHead.mockResolvedValue({ status: 200 });
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version, '', '');
			await artifact.exists();
			expect(mockAxiosHead).toHaveBeenCalledWith(artifact.url, {});
		});
	});

	describe('waitFor', () => {
		it('returns true immediately when the artifact is found on the first attempt', async () => {
			mockAxiosHead.mockResolvedValue({ status: 200 });
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			const found = await artifact.waitFor(5);
			expect(found).toBe(true);
			expect(mockAxiosHead).toHaveBeenCalledTimes(1);
		});

		it('retries and returns true when the artifact appears on a subsequent attempt', async () => {
			const error = new Error('Not Found');
			error.response = { status: 404 };
			mockAxiosHead
				.mockRejectedValueOnce(error)
				.mockRejectedValueOnce(error)
				.mockResolvedValue({ status: 200 });
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			const waitForPromise = artifact.waitFor(5, 1);
			await jest.runAllTimersAsync();
			const found = await waitForPromise;
			expect(found).toBe(true);
			expect(mockAxiosHead).toHaveBeenCalledTimes(3);
		});

		it('returns false when the timeout expires before the artifact is found', async () => {
			const error = new Error('Not Found');
			error.response = { status: 404 };
			mockAxiosHead.mockRejectedValue(error);
			const artifact = new MavenArtifact(repositoryUrl, artifactPath, version);
			const waitForPromise = artifact.waitFor(0.001, 1);
			await jest.runAllTimersAsync();
			const found = await waitForPromise;
			expect(found).toBe(false);
		});
	});
});
