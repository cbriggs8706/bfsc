// drizzle.config.ts
import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'
dotenv.config({ path: '.env' })

export default defineConfig({
	dialect: 'postgresql',
	schema: './db/schema',
	out: './drizzle',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	// tablesFilter: ['public.*'],
	strict: true,
})
