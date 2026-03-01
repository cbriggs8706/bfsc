import { GenieGreenieMicroskillProgress } from '@/lib/genieGreenieClient'

type CourseForMicroskill = {
	id: string
	slug: string
	title: string
	description: string | null
	category: string | null
	level: number | null
	sortOrder: number
	isPublished: boolean
	badgeIconName: string | null
	updatedAt: Date
}

export type AvailableMicroskill = {
	id: number
	name: string
	slug: string
	status: GenieGreenieMicroskillProgress['status']
	category: string
	categorySort: number
	skillLevel: string
	skillSort: number
	description: string
	version: number
	isPublic: boolean
	badgeIcon: string
	updatedAt: string
	continueUrl: string
	resourceUrl?: string
	matchedCourseId?: string
}

function buildCategorySortMap(courses: CourseForMicroskill[]) {
	const byCategory = new Map<string, number>()
	for (const course of courses) {
		if (!course.category) continue
		const existing = byCategory.get(course.category)
		if (existing === undefined || course.sortOrder < existing) {
			byCategory.set(course.category, course.sortOrder)
		}
	}
	return byCategory
}

export function buildAvailableMicroskills(
	statuses: GenieGreenieMicroskillProgress[],
	coursesBySlug: Map<string, CourseForMicroskill>
): AvailableMicroskill[] {
	const categorySort = buildCategorySortMap(Array.from(coursesBySlug.values()))

	return statuses
		.map((status, index) => {
			const matched = coursesBySlug.get(status.microskillSlug)
			const category = matched?.category ?? 'Genie Greenie'
			const sort = matched?.sortOrder ?? index
			const level =
				typeof matched?.level === 'number' ? `Level ${matched.level}` : 'General'

			return {
				id: status.microskillId,
				name: matched?.title ?? status.microskillTitle,
				slug: status.microskillSlug,
				status: status.status,
				category,
				categorySort: categorySort.get(category) ?? 0,
				skillLevel: level,
				skillSort: sort,
				description: matched?.description ?? '',
				version: status.currentVersion,
				isPublic: matched?.isPublished ?? true,
				badgeIcon: matched?.badgeIconName ?? status.badgeIcon,
				updatedAt: (matched?.updatedAt ?? new Date()).toISOString(),
				continueUrl: status.continueUrl,
				matchedCourseId: matched?.id,
			}
		})
		.sort(
			(a, b) =>
				a.categorySort - b.categorySort ||
				a.skillSort - b.skillSort ||
				a.name.localeCompare(b.name)
		)
}
