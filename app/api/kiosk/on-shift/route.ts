// app/api/kiosk/on-shift/route.ts
import { db, learningCourses, userCertificates } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema/tables/kiosk'
import { CertificateSummary } from '@/types/training'
import { gt, eq, inArray, and, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
	const now = new Date() // UTC-safe

	const workers = await db
		.select({
			personId: kioskShiftLogs.personId,
			userId: kioskPeople.userId, // 👈 ADD THIS
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
			languages: kioskPeople.languagesSpoken,
			pid: kioskPeople.pid,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(
			and(
				gt(kioskShiftLogs.expectedDepartureAt, now),
				isNull(kioskShiftLogs.actualDepartureAt)
			)
		)
	console.log('ON SHIFT ROUTE HIT')

	// console.log('SHIFT LOGS FOUND', await db.select().from(kioskShiftLogs))

	// console.log('WORKERS RESULT', workers)

	const userIds = workers
		.map((c) => c.userId)
		.filter((id): id is string => Boolean(id))
	// console.log('USER IDS FOR CERT LOOKUP:', userIds)

	const certificatesByUser: Record<string, CertificateSummary[]> = {}

	if (userIds.length > 0) {
		const certs = await db
			.select({
				id: userCertificates.id,
				userId: userCertificates.userId,

				// snapshot (fallback)
				certTitle: userCertificates.title,
				certCategory: userCertificates.category,
				certLevel: userCertificates.level,

				source: userCertificates.source,
				courseVersion: userCertificates.courseVersion,

				// course source-of-truth
				courseTitle: learningCourses.title,
				courseCategory: learningCourses.category,
				courseLevel: learningCourses.level,
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

			// ✅ derive display metadata (same rule as dashboard)
			const title =
				cert.source === 'internal' && cert.courseTitle
					? cert.courseTitle
					: cert.certTitle

			const category =
				cert.source === 'internal' && cert.courseCategory
					? cert.courseCategory
					: cert.certCategory

			const level =
				cert.source === 'internal' && cert.courseLevel !== null
					? cert.courseLevel
					: cert.certLevel

			if (!certificatesByUser[cert.userId]) {
				certificatesByUser[cert.userId] = []
			}

			certificatesByUser[cert.userId].push({
				id: cert.id,
				title,
				category,
				level,
				source: cert.source,
				status,
			})
		}
	}

	return new Response(JSON.stringify({ workers, certificatesByUser }), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
		},
	})
}
