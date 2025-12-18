// app/api/kiosk/on-shift/route.ts
import { db, learningCourses, userCertificates } from '@/db'
import { kioskShiftLogs, kioskPeople } from '@/db/schema/tables/kiosk'
import { CertificateSummary } from '@/types/training'
import { gt, eq, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
	const now = new Date() // UTC-safe

	const consultants = await db
		.select({
			personId: kioskShiftLogs.personId,
			userId: kioskPeople.userId, // 👈 ADD THIS
			fullName: kioskPeople.fullName,
			profileImageUrl: kioskPeople.profileImageUrl,
		})
		.from(kioskShiftLogs)
		.innerJoin(kioskPeople, eq(kioskShiftLogs.personId, kioskPeople.id))
		.where(gt(kioskShiftLogs.expectedDepartureAt, now))
	console.log('ON SHIFT ROUTE HIT')

	// console.log('SHIFT LOGS FOUND', await db.select().from(kioskShiftLogs))

	// console.log('CONSULTANTS RESULT', consultants)

	const userIds = consultants
		.map((c) => c.userId)
		.filter((id): id is string => Boolean(id))
	// console.log('USER IDS FOR CERT LOOKUP:', userIds)

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
				// ✅ MUST be leftJoin
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
	return new Response(JSON.stringify({ consultants, certificatesByUser }), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
		},
	})
}
