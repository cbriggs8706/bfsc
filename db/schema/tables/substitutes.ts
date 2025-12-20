// db/schema/tables/substitutes.ts
import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	boolean,
	index,
	uniqueIndex,
	check,
	pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { user } from './auth'
import { weeklyShifts, shiftRecurrences } from './shifts'

/* ======================================================
 * Enums (varchar + DB checks)
 * ==================================================== */

export const SUB_REQUEST_TYPES = ['substitute', 'trade'] as const
export type SubRequestType = (typeof SUB_REQUEST_TYPES)[number]

export const SUB_REQUEST_STATUSES = [
	'open',
	'awaiting_request_confirmation',
	'awaiting_nomination_confirmation',
	'accepted',
	'cancelled',
	'expired',
] as const
export type SubRequestStatus = (typeof SUB_REQUEST_STATUSES)[number]

export const VOLUNTEER_STATUSES = ['offered', 'withdrawn'] as const
export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number]

export const TRADE_OFFER_STATUSES = ['offered', 'withdrawn'] as const
export type TradeOfferStatus = (typeof TRADE_OFFER_STATUSES)[number]

export const TRADE_OPTION_STATUSES = [
	'offered',
	'selected',
	'declined',
] as const
export type TradeOptionStatus = (typeof TRADE_OPTION_STATUSES)[number]

export const AVAILABILITY_LEVELS = ['usually', 'maybe'] as const
export type AvailabilityLevel = (typeof AVAILABILITY_LEVELS)[number]

export const subRequestTypeEnum = pgEnum('sub_request_type', [
	'substitute',
	'trade',
])

export const subRequestStatusEnum = pgEnum('sub_request_status', [
	'open',
	'awaiting_request_confirmation',
	'awaiting_nomination_confirmation',
	'accepted',
	'cancelled',
	'expired',
])

/* ======================================================
 * Shift substitute / trade requests
 * ==================================================== */

export const shiftSubRequests = pgTable(
	'shift_sub_requests',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// The shift "shape"
		shiftId: uuid('shift_id')
			.notNull()
			.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

		// Which recurrence this instance belongs to (for matching + display)
		shiftRecurrenceId: uuid('shift_recurrence_id')
			.notNull()
			.references(() => shiftRecurrences.id, { onDelete: 'cascade' }),

		// Specific date (your answer #2)
		date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD

		// Snapshot times for safety (in case shift definition changes later)
		startTime: varchar('start_time', { length: 5 }).notNull(), // "10:00"
		endTime: varchar('end_time', { length: 5 }).notNull(),

		type: subRequestTypeEnum('type').notNull(),
		status: subRequestStatusEnum('status').notNull().default('open'),

		requestedByUserId: uuid('requested_by_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		notes: text('notes'),

		// "I already have a sub"
		hasNominatedSub: boolean('has_nominated_sub').notNull().default(false),
		nominatedSubUserId: uuid('nominated_sub_user_id').references(
			() => user.id,
			{
				onDelete: 'set null',
			}
		),
		nominatedConfirmedAt: timestamp('nominated_confirmed_at', {
			withTimezone: true,
		}),

		// Final acceptance (sub or trade)
		acceptedByUserId: uuid('accepted_by_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		acceptedAt: timestamp('accepted_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		dateIdx: index('shift_sub_requests_date_idx').on(t.date),
		shiftIdx: index('shift_sub_requests_shift_idx').on(t.shiftId),
		requestedByIdx: index('shift_sub_requests_requested_by_idx').on(
			t.requestedByUserId
		),

		// Prevent duplicate open requests for the same user/shift/date
		uniqRequesterShiftDate: uniqueIndex(
			'shift_sub_requests_requester_shift_date_uq'
		).on(t.requestedByUserId, t.shiftId, t.date),
	})
)

/* DB checks for string enums */
export const shiftSubRequestsChecks = sql`
  ALTER TABLE "shift_sub_requests"
    ADD CONSTRAINT shift_sub_requests_type_ck
      CHECK (type IN ('substitute','trade')),
    ADD CONSTRAINT shift_sub_requests_status_ck
      CHECK (status IN ('open','awaiting_request_confirmation','awaiting_nomination_confirmation','accepted','cancelled','expired'));
`

/* ======================================================
 * Substitute volunteers (for substitute-type requests)
 * ==================================================== */

export const shiftSubVolunteers = pgTable(
	'shift_sub_volunteers',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		requestId: uuid('request_id')
			.notNull()
			.references(() => shiftSubRequests.id, { onDelete: 'cascade' }),

		volunteerUserId: uuid('volunteer_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		status: varchar('status', { length: 20 }).notNull().default('offered'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		requestIdx: index('shift_sub_volunteers_request_idx').on(t.requestId),
		volunteerIdx: index('shift_sub_volunteers_volunteer_idx').on(
			t.volunteerUserId
		),

		uniqVolunteerPerRequest: uniqueIndex(
			'shift_sub_volunteers_request_volunteer_uq'
		).on(t.requestId, t.volunteerUserId),
	})
)

export const shiftSubVolunteersChecks = sql`
  ALTER TABLE "shift_sub_volunteers"
    ADD CONSTRAINT shift_sub_volunteers_status_ck
      CHECK (status IN ('offered','withdrawn'));
`

/* ======================================================
 * Trade offers (a volunteer offers to trade + attaches options)
 * ==================================================== */

export const shiftTradeOffers = pgTable(
	'shift_trade_offers',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		requestId: uuid('request_id')
			.notNull()
			.references(() => shiftSubRequests.id, { onDelete: 'cascade' }),

		offeredByUserId: uuid('offered_by_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		message: text('message'),

		status: varchar('status', { length: 20 }).notNull().default('offered'),

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		requestIdx: index('shift_trade_offers_request_idx').on(t.requestId),
		offeredByIdx: index('shift_trade_offers_offered_by_idx').on(
			t.offeredByUserId
		),

		uniqOfferPerUserPerRequest: uniqueIndex(
			'shift_trade_offers_request_user_uq'
		).on(t.requestId, t.offeredByUserId),
	})
)

export const shiftTradeOffersChecks = sql`
  ALTER TABLE "shift_trade_offers"
    ADD CONSTRAINT shift_trade_offers_status_ck
      CHECK (status IN ('offered','withdrawn'));
`

export const shiftTradeOfferOptions = pgTable(
	'shift_trade_offer_options',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		offerId: uuid('offer_id')
			.notNull()
			.references(() => shiftTradeOffers.id, { onDelete: 'cascade' }),

		// The option being offered (volunteer's shift instance)
		shiftId: uuid('shift_id')
			.notNull()
			.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

		shiftRecurrenceId: uuid('shift_recurrence_id')
			.notNull()
			.references(() => shiftRecurrences.id, { onDelete: 'cascade' }),

		date: varchar('date', { length: 10 }).notNull(),
		startTime: varchar('start_time', { length: 5 }).notNull(),
		endTime: varchar('end_time', { length: 5 }).notNull(),

		status: varchar('status', { length: 20 }).notNull().default('offered'),
	},
	(t) => ({
		offerIdx: index('shift_trade_offer_options_offer_idx').on(t.offerId),
		dateIdx: index('shift_trade_offer_options_date_idx').on(t.date),

		// same offer cannot include the same shift/date twice
		uniqOptionPerOffer: uniqueIndex(
			'shift_trade_offer_options_offer_shift_date_uq'
		).on(t.offerId, t.shiftId, t.date),
	})
)

export const shiftTradeOfferOptionsChecks = sql`
  ALTER TABLE "shift_trade_offer_options"
    ADD CONSTRAINT shift_trade_offer_options_status_ck
      CHECK (status IN ('offered','selected','declined'));
`

/* ======================================================
 * Consultant availability (usually/maybe)
 * ==================================================== */

export const consultantShiftAvailability = pgTable(
	'consultant_shift_availability',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		shiftId: uuid('shift_id')
			.notNull()
			.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

		// If null => applies to ANY recurrence of that shift
		shiftRecurrenceId: uuid('shift_recurrence_id').references(
			() => shiftRecurrences.id,
			{ onDelete: 'cascade' }
		),

		level: varchar('level', { length: 20 }).notNull(), // usually | maybe

		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		userIdx: index('consultant_shift_availability_user_idx').on(t.userId),
		shiftIdx: index('consultant_shift_availability_shift_idx').on(t.shiftId),

		uniqAvailability: uniqueIndex('consultant_shift_availability_uq').on(
			t.userId,
			t.shiftId,
			t.shiftRecurrenceId
		),

		// If you store both (shiftId + recurrenceId), require recurrence belongs to shift?
		// That’s app-level validation in v1.
	})
)

export const consultantShiftAvailabilityChecks = sql`
  ALTER TABLE "consultant_shift_availability"
    ADD CONSTRAINT consultant_shift_availability_level_ck
      CHECK (level IN ('usually','maybe'));
`

export const shiftAssignmentExceptions = pgTable(
	'shift_assignment_exceptions',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		shiftId: uuid('shift_id')
			.notNull()
			.references(() => weeklyShifts.id, { onDelete: 'cascade' }),

		shiftRecurrenceId: uuid('shift_recurrence_id')
			.notNull()
			.references(() => shiftRecurrences.id, { onDelete: 'cascade' }),

		date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD

		assignedUserId: uuid('assigned_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		reason: varchar('reason', { length: 30 }).notNull(), // 'substitute' | 'trade'

		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		dateIdx: index('shift_assignment_exceptions_date_idx').on(t.date),
		recurrenceIdx: index('shift_assignment_exceptions_recurrence_idx').on(
			t.shiftRecurrenceId
		),
	})
)

/* ======================================================
 * Typed model helpers (no `any`)
 * ==================================================== */

export type ShiftSubRequestRow = typeof shiftSubRequests.$inferSelect
export type ShiftSubRequestInsert = typeof shiftSubRequests.$inferInsert

export type ShiftSubVolunteerRow = typeof shiftSubVolunteers.$inferSelect
export type ShiftSubVolunteerInsert = typeof shiftSubVolunteers.$inferInsert

export type ShiftTradeOfferRow = typeof shiftTradeOffers.$inferSelect
export type ShiftTradeOfferInsert = typeof shiftTradeOffers.$inferInsert

export type ShiftTradeOfferOptionRow =
	typeof shiftTradeOfferOptions.$inferSelect
export type ShiftTradeOfferOptionInsert =
	typeof shiftTradeOfferOptions.$inferInsert

export type ConsultantShiftAvailabilityRow =
	typeof consultantShiftAvailability.$inferSelect
export type ConsultantShiftAvailabilityInsert =
	typeof consultantShiftAvailability.$inferInsert
