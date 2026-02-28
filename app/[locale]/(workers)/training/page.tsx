// app/[locale]/(workers)/training/page.tsx

import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { learningCourses, learningLessonCompletions } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { UserCourse } from '@/types/training'
import { redirect } from 'next/navigation'
import { CourseCatalog } from '@/components/training/CourseCatalog'
import { getTranslations } from 'next-intl/server'
import { getCourseBadgeUrl } from '@/lib/storage/courseBadges.server'
import { lookupMicroskillStatusesByEmail } from '@/lib/genieGreenieClient'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function TrainingCatalogPage({ params }: Props) {
	const { locale } = await params
	const user = await getCurrentUser()
	const t = await getTranslations({ locale, namespace: 'common' })

	if (!user || user.role === 'Patron') {
		redirect(`/${locale}/login?redirect=/${locale}/training`)
	}

	const courses = await db.query.learningCourses.findMany({
		where: eq(learningCourses.isPublished, true),
		orderBy: (courses, { asc }) => [asc(courses.sortOrder)],
		with: {
			units: {
				with: {
					lessons: true,
				},
			},
		},
	})

	const completions = await db
		.select({
			lessonId: learningLessonCompletions.lessonId,
		})
		.from(learningLessonCompletions)
		.where(eq(learningLessonCompletions.userId, user.id))

	const completedLessonIds = new Set(completions.map((c) => c.lessonId))

	const userCourses: UserCourse[] = courses.map((course) => {
		const lessons = course.units.flatMap((u) => u.lessons)
		const completedCount = lessons.filter((l) =>
			completedLessonIds.has(l.id)
		).length

		return {
			id: course.id,
			title: course.title,
			description: course.description,
			badgeImageUrl: getCourseBadgeUrl(course.badgeImagePath),
			badgeIconName: course.badgeIconName,
			sortOrder: course.sortOrder,
			contentVersion: course.contentVersion,
			units: course.units.map((unit) => ({
				id: unit.id,
				title: unit.title,
				lessons: unit.lessons.map((lesson) => ({
					id: lesson.id,
					title: lesson.title,
					isCompleted: completedLessonIds.has(lesson.id),
					blocks: [],
				})),
			})),
			completedLessonCount: completedCount,
			totalLessonCount: lessons.length,
			isCompleted: completedCount === lessons.length,
		}
	})

	let genieGreenieCourses: UserCourse[] = []

	try {
		const lookup = await lookupMicroskillStatusesByEmail(user.email)
		const courseBySlug = new Map(courses.map((course) => [course.slug, course]))

		genieGreenieCourses = lookup.statuses
			.filter((status) => status.status !== 'not_started')
			.map((status, index) => {
				const matchedCourse = courseBySlug.get(status.microskillSlug)
				const total = Math.max(status.requiredTotal, 0)
				const completed = Math.min(Math.max(status.requiredCompleted, 0), total)

				return {
					id: `genie-greenie-${status.microskillSlug}`,
					title: matchedCourse?.title ?? status.microskillTitle,
					description: null,
					badgeImageUrl: getCourseBadgeUrl(matchedCourse?.badgeImagePath),
					badgeIconName: matchedCourse?.badgeIconName ?? status.badgeIcon,
					continueUrl: status.continueUrl,
					units: [],
					sortOrder: courses.length + index,
					completedLessonCount: completed,
					contentVersion: status.currentVersion,
					totalLessonCount: total,
					isCompleted:
						status.status === 'active' || status.status === 'renewal_required',
				}
			})
	} catch {
		// Leave partner section empty if partner API is unavailable.
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">{t('workerTraining')}</h1>
				<p className="text-sm text-muted-foreground">{t('sub')}</p>
			</div>
			<CourseCatalog courses={userCourses} locale={locale} />
			{genieGreenieCourses.length > 0 ? (
				<div className="space-y-3">
					<h2 className="text-2xl font-semibold">Genie Greenie Training</h2>
					<CourseCatalog
						courses={genieGreenieCourses}
						locale={locale}
						showActions={true}
					/>
				</div>
			) : null}
		</div>
	)
}
