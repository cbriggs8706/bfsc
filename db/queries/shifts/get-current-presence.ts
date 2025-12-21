// db/queries/shifts/get-current-presence.ts
import { db, learningCourses, userCertificates } from '@/db'
import {
	kioskShiftLogs,
	kioskPeople,
	kioskVisitLogs,
	kioskVisitPurposes,
} from '@/db/schema/tables/kiosk'
import { CertificateSummary } from '@/types/training'
import { gt, eq, inArray, and, isNull, sql } from 'drizzle-orm'

/**
 * Fixed timezone for the physical center.
 * Change this if the center ever relocates.
 */
const CENTER_TIMEZONE = 'America/Boise'

export async function getCurrentPresence() {
	const now = new Date()

	// ──────────────────────────────
	// CONSULTANTS CURRENTLY ON SHIFT
	// ──────────────────────────────
	const consultants = await db
		.select({
			personId: kioskShiftLogs.personId,
			userId: kioskPeople.userId,
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(gt(kioskShiftLogs.expectedDepartureAt, now))

	// ──────────────────────────────
	// CERTIFICATES FOR CONSULTANTS
	// ──────────────────────────────
	const userIds = consultants
		.map((c) => c.userId)
		.filter((id): id is string => Boolean(id))

	const certificatesByUser: Record<string, CertificateSummary[]> = {}

	if (userIds.length > 0) {
		const certs = await db
			.select({
				id: userCertificates.id,
				userId: userCertificates.userId,
				title: userCertificates.title,
				category: userCertificates.category,
				level: userCertificates.level,
				source: userCertificates.source,
				courseVersion: userCertificates.courseVersion,
				currentCourseVersion: learningCourses.contentVersion,
			})
			.from(userCertificates)
			.leftJoin(
				learningCourses,
				eq(userCertificates.courseId, learningCourses.id)
			)
			.where(inArray(userCertificates.userId, userIds))

		for (const cert of certs) {
			let status: CertificateSummary['status']

			if (cert.source === 'external') {
				status = 'current'
			} else if (
				cert.courseVersion !== null &&
				cert.currentCourseVersion !== null &&
				cert.courseVersion === cert.currentCourseVersion
			) {
				status = 'current'
			} else {
				status = 'renewal-required'
			}

			if (!certificatesByUser[cert.userId]) {
				certificatesByUser[cert.userId] = []
			}

			certificatesByUser[cert.userId].push({
				id: cert.id,
				title: cert.title,
				category: cert.category,
				level: cert.level,
				source: cert.source,
				status,
			})
		}
	}

	// ──────────────────────────────
	// PATRONS CURRENTLY VISITING (TODAY, LOCAL TIME)
	// ──────────────────────────────
	const patrons = await db
		.select({
			personId: kioskPeople.id,
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
			purposeName: kioskVisitPurposes.name,
		})
		.from(kioskVisitLogs)
		.innerJoin(kioskPeople, eq(kioskVisitLogs.personId, kioskPeople.id))
		.leftJoin(
			kioskVisitPurposes,
			eq(kioskVisitLogs.purposeId, kioskVisitPurposes.id)
		)
		// Join shift logs to EXCLUDE consultants currently on shift
		.leftJoin(
			kioskShiftLogs,
			and(
				eq(kioskShiftLogs.personId, kioskVisitLogs.personId),
				gt(kioskShiftLogs.expectedDepartureAt, now)
			)
		)
		.where(
			and(
				// Not currently on a consultant shift
				isNull(kioskShiftLogs.personId),

				// Only visits from "today" in CENTER_TIMEZONE
				sql`
					${kioskVisitLogs.createdAt}
					AT TIME ZONE ${CENTER_TIMEZONE}
					>= date_trunc(
						'day',
						now() AT TIME ZONE ${CENTER_TIMEZONE}
					)
				`
			)
		)

	return {
		consultants,
		patrons,
		certificatesByUser,
	}
}
