import {
	GraduationCap,
	Apple,
	Bot,
	Pencil,
	Tally5,
	Trophy,
	Calendar,
	LifeBuoy,
	Send,
	Music,
	BookOpen,
	BookKey,
	HandHeart,
	LetterText,
	Text,
	Group,
	Users,
	Dog,
	Camera,
	Search,
	User,
	Megaphone,
	Users2Icon,
} from 'lucide-react'
import type { TFunction } from '@/types/i18n'

export function buildSidebarData(t: TFunction, locale: string) {
	return {
		navMain: [
			{
				title: t('sidebar.main.groups'),
				url: `/${locale}/groups`,
				icon: Users,
				items: [{ title: t('sidebar.groups.schedule'), url: '#' }],
			},
			{
				title: t('sidebar.main.projects'),
				url: '#',
				icon: Dog,
				items: [
					{ title: t('sidebar.projects.cassiaphotos'), url: '#' },
					{ title: t('sidebar.projects.cassianegatives'), url: '#' },
					{ title: t('sidebar.projects.findagrave'), url: '#' },
					{ title: t('sidebar.projects.mccemeteries'), url: '#' },
					{ title: t('sidebar.projects.censuses'), url: '#' },
					{ title: t('sidebar.projects.mvwwii'), url: '#' },
					{ title: t('sidebar.projects.naturalization'), url: '#' },
					{ title: t('sidebar.projects.numident'), url: '#' },
					{ title: t('sidebar.projects.obituaries'), url: '#' },
					{ title: t('sidebar.projects.oral'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.digitization'),
				url: '#',
				icon: Camera,
				items: [
					// { title: t('sidebar.digitization.verbs'), url: '#' },
					// { title: t('sidebar.digitization.scramble'), url: '#' },
					// { title: t('sidebar.digitization.builder'), url: '#' },
					// { title: t('sidebar.digitization.memorizer'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.calendar'),
				url: `/${locale}/calendar`,
				icon: Calendar,
				items: [
					{ title: t('sidebar.calendar.expo'), url: '#' },
					{ title: t('sidebar.calendar.memorylane'), url: '#' },
					{ title: t('sidebar.calendar.classes'), url: '#' },
					// { title: t('sidebar.calendar.syllables'), url: '#' },
					// { title: t('sidebar.calendar.niqqud'), url: '#' },
				],
			},
		],

		navSecondary: [
			{ title: t('sidebar.secondary.leaderboard'), url: '#', icon: Trophy },
			{
				title: t('sidebar.secondary.calendar'),
				url: `/${locale}/calendar`,
				icon: Calendar,
			},
			{ title: t('sidebar.secondary.help'), url: '#', icon: LifeBuoy },
			{ title: t('sidebar.secondary.feedback'), url: '#', icon: Send },
		],

		input: [
			{
				name: t('sidebar.input.specialists'),
				url: `/${locale}/specialists`,
				icon: Search,
			},
			// { name: t('sidebar.input.stories'), url: '#', icon: BookOpen },
			// { name: t('sidebar.input.scriptures'), url: '#', icon: BookKey },
			// { name: t('sidebar.input.prayers'), url: '#', icon: HandHeart },
		],
		admin: [
			{
				name: t('sidebar.admin.users'),
				url: `/${locale}/admin/users`,
				icon: User,
			},
			{
				name: 'Visit Reasons',
				url: `/${locale}/admin/kiosk/purposes`,
				icon: Pencil,
			},
			{
				name: 'Define Shifts',
				url: `/${locale}/admin/shifts/define`,
				icon: Calendar,
			},
			{
				name: 'Shift Scheduler',
				url: `/${locale}/admin/shifts/assignments`,
				icon: Calendar,
			},
			{
				name: 'Announcements',
				url: `/${locale}/admin/announcements`,
				icon: Megaphone,
			},
			// { name: t('sidebar.input.prayers'), url: '#', icon: HandHeart },
		],

		consultant: [
			{
				name: t('sidebar.consultant.shiftReport'),
				url: `/${locale}/dashboard/reports/shifts`,
				icon: Users2Icon,
			},
		],

		lesson: [{ name: t('sidebar.lesson.scripts'), url: '#', icon: LetterText }],
	}
}

export function getTeacherNav(t: TFunction, locale: string) {
	return [
		{
			title: t('sidebar.teacher.title'),
			url: `/${locale}/admin/courses`,
			icon: GraduationCap,
			isActive: true,
			items: [
				{
					title: t('sidebar.teacher.myCourses'),
					url: `/${locale}/admin/courses`,
				},
				{
					title: t('sidebar.teacher.createCourse'),
					url: `/${locale}/courses/create`,
				},
			],
		},
	]
}
