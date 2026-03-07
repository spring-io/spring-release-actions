import { defineConfig } from 'vitest/config';
import { execSync } from 'child_process';

const actBinary = process.env.ACT_BINARY ?? execSync('which act').toString().trim();

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['action-tests/**/*.act.test.js'],
		env: {
			ACT_BINARY: actBinary,
		},
	},
});
