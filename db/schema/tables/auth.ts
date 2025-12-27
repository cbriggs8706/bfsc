// db/schema/tables/auth.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	integer,
	timestamp,
	primaryKey,
	unique,
	foreignKey,
	boolean,
} from 'drizzle-orm/pg-core'

// --- User table ---
export const user = pgTable(
	'public.user',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: varchar({ length: 255 }),
		email: varchar({ length: 255 }).notNull(),
		emailVerified: timestamp({ withTimezone: true }),
		image: text(),
		username: varchar({ length: 100 }),
		passwordHash: text('password_hash'),
		role: varchar({ length: 50 }).default('Patron').notNull(),
		isActiveWorker: boolean('is_active_worker').notNull().default(true),
	},
	(table) => [unique('user_email_unique').on(table.email)]
)

// --- Account table ---
export const account = pgTable(
	'public.account',
	{
		userId: uuid().notNull(),
		type: varchar({ length: 255 }).notNull(),
		provider: varchar({ length: 255 }).notNull(),
		providerAccountId: varchar({ length: 255 }).notNull(),
		refresh_token: text(),
		access_token: text(),
		expires_at: integer(),
		token_type: varchar({ length: 255 }),
		scope: text(),
		id_token: text(),
		session_state: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_userId_user_id_fk',
		}).onDelete('cascade'),
		primaryKey({
			columns: [table.provider, table.providerAccountId],
			name: 'account_provider_providerAccountId_pk',
		}),
	]
)

// --- Session table ---
export const session = pgTable(
	'public.session',
	{
		sessionToken: text().primaryKey().notNull(),
		userId: uuid().notNull(),
		expires: timestamp({ withTimezone: true, mode: 'date' }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_userId_user_id_fk',
		}).onDelete('cascade'),
	]
)

// --- Verification Token ---
export const verificationToken = pgTable(
	'public.verificationToken',
	{
		identifier: varchar({ length: 255 }).notNull(),
		token: text().notNull(),
		expires: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.identifier, table.token],
			name: 'verificationToken_identifier_token_pk',
		}),
	]
)
