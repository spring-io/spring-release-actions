import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		clearMocks: true,
		include: ['tests/**/*.test.js', 'integration-tests/**/*.test.js'],
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			reporter: ['json-summary', 'text', 'lcov'],
			reportsDirectory: './coverage',
		},
	},
});
