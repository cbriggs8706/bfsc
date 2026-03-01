import { NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'

import { appSettings, db, learningCourses } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import {
	GenieGreenieClientError,
	lookupMicroskillStatusesByEmail,
} from '@/lib/genieGreenieClient'
import { buildAvailableMicroskills } from '@/lib/training/microskill-assignment'

function mapGenieError(error: GenieGreenieClientError) {
	if (error.code === 'BAD_REQUEST') return { status: 400, message: error.message }
	if (error.code === 'UNAUTHORIZED') return { status: 502, message: error.message }
	if (error.code === 'CONFIG') {
		return {
			status: 500,
			message: 'Genie Greenie integration is not configured',
		}
	}
	return {
		status: 502,
		message: 'Unable to fetch Genie Greenie microskill catalog',
	}
}

async function getOrCreateSettingsRow() {
	const [existing] = await db
		.select({
			id: appSettings.id,
			assignedGenieGreenieMicroskillIds:
				appSettings.assignedGenieGreenieMicroskillIds,
		})
		.from(appSettings)
		.limit(1)

	if (existing) return existing

	const [created] = await db
		.insert(appSettings)
		.values({
			timeZone: 'America/Boise',
			timeFormat: 'h:mm a',
			dateFormat: 'MMM d, yyyy',
			use24HourClock: false,
			assignedGenieGreenieMicroskillIds: [],
		})
		.returning({
			id: appSettings.id,
			assignedGenieGreenieMicroskillIds:
				appSettings.assignedGenieGreenieMicroskillIds,
		})

	return created
}

async function getCatalogForAdmin() {
	const current = await getCurrentUser()
	if (!current || current.role !== 'Admin') {
		return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
	}
	if (!current.email) {
		return {
			error: NextResponse.json(
				{ error: 'Signed-in admin must have an email' },
				{ status: 400 }
			),
		}
	}

	try {
		const lookup = await lookupMicroskillStatusesByEmail(current.email)
		const slugs = Array.from(new Set(lookup.statuses.map((s) => s.microskillSlug)))

		const courses = slugs.length
			? await db
					.select({
						id: learningCourses.id,
						slug: learningCourses.slug,
						title: learningCourses.title,
						description: learningCourses.description,
						category: learningCourses.category,
						level: learningCourses.level,
						sortOrder: learningCourses.sortOrder,
						isPublished: learningCourses.isPublished,
						badgeIconName: learningCourses.badgeIconName,
						updatedAt: learningCourses.updatedAt,
					})
					.from(learningCourses)
					.where(
						and(
							eq(learningCourses.isPublished, true),
							inArray(learningCourses.slug, slugs)
						)
					)
			: []

		const coursesBySlug = new Map(courses.map((course) => [course.slug, course]))
		const microskills = buildAvailableMicroskills(lookup.statuses, coursesBySlug)
		return { microskills }
	} catch (error) {
		if (error instanceof GenieGreenieClientError) {
			const mapped = mapGenieError(error)
			return {
				error: NextResponse.json({ error: mapped.message }, { status: mapped.status }),
			}
		}

		return {
			error: NextResponse.json(
				{ error: 'Unable to fetch Genie Greenie microskill catalog' },
				{ status: 500 }
			),
		}
	}
}

export async function GET() {
	const settings = await getOrCreateSettingsRow()
	const catalog = await getCatalogForAdmin()
	if ('error' in catalog) return catalog.error

	return NextResponse.json({
		microskills: catalog.microskills,
		assignedMicroskillIds: settings.assignedGenieGreenieMicroskillIds ?? [],
	})
}

export async function POST(request: Request) {
	const current = await getCurrentUser()
	if (!current || current.role !== 'Admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const body = (await request.json()) as {
		microskillIds?: number[]
	}

	const microskillIds = Array.isArray(body.microskillIds)
		? Array.from(
				new Set(
					body.microskillIds.filter((id): id is number => Number.isInteger(id))
				)
			)
		: []

	const settings = await getOrCreateSettingsRow()

	await db
		.update(appSettings)
		.set({
			assignedGenieGreenieMicroskillIds: microskillIds,
			updatedAt: new Date(),
		})
		.where(eq(appSettings.id, settings.id))

	return NextResponse.json({
		ok: true,
		assignedMicroskillIds: microskillIds,
	})
}
