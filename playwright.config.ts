import { defineConfig } from '@playwright/test'
import 'dotenv/config'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 60_000,
	expect: {
		timeout: 15_000,
	},
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'pnpm dev',
		port: 3000,
		reuseExistingServer: true,
		timeout: 120_000,
	},
})
