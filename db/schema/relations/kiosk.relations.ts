import { relations } from 'drizzle-orm'
import {
	kioskPeople,
	kioskVisitPurposes,
	kioskVisitLogs,
	kioskShiftLogs,
} from '../tables/kiosk'
import { user } from '../tables/auth'

// ──────────────────────────────────────────────
// kiosk_people relations
// ──────────────────────────────────────────────
export const kioskPeopleRelations = relations(kioskPeople, ({ one, many }) => ({
	user: one(user, {
		fields: [kioskPeople.userId],
		references: [user.id],
	}),

	visitLogs: many(kioskVisitLogs),
	shiftLogs: many(kioskShiftLogs),
}))

// ──────────────────────────────────────────────
// kiosk_visit_purposes relations
// ──────────────────────────────────────────────
export const kioskVisitPurposesRelations = relations(
	kioskVisitPurposes,
	({ many }) => ({
		visitLogs: many(kioskVisitLogs),
	})
)

// ──────────────────────────────────────────────
// kiosk_visit_logs relations
// ──────────────────────────────────────────────
export const kioskVisitLogsRelations = relations(kioskVisitLogs, ({ one }) => ({
	person: one(kioskPeople, {
		fields: [kioskVisitLogs.personId],
		references: [kioskPeople.id],
	}),

	purpose: one(kioskVisitPurposes, {
		fields: [kioskVisitLogs.purposeId],
		references: [kioskVisitPurposes.id],
	}),

	user: one(user, {
		fields: [kioskVisitLogs.userId],
		references: [user.id],
	}),
}))

// ──────────────────────────────────────────────
// kiosk_shift_logs relations
// ──────────────────────────────────────────────
export const kioskShiftLogsRelations = relations(kioskShiftLogs, ({ one }) => ({
	person: one(kioskPeople, {
		fields: [kioskShiftLogs.personId],
		references: [kioskPeople.id],
	}),

	user: one(user, {
		fields: [kioskShiftLogs.userId],
		references: [user.id],
	}),
}))
