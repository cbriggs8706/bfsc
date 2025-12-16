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
	X,
	CalendarX,
	Clock,
	Lectern,
	Ticket,
	AtSign,
	Book,
	Users2,
	Brain,
	BadgeQuestionMark,
	MapIcon,
	Newspaper,
	PlusCircle,
} from 'lucide-react'
import type { TFunction } from '@/types/i18n'
import { CASE_VIEWS } from '@/lib/cases/views'

export function buildSidebarData(t: TFunction, locale: string) {
	return {
		navMain: [
			// {
			// 	title: t('sidebar.main.groups'),
			// 	url: `/${locale}/groups`,
			// 	icon: Users,
			// 	items: [{ title: t('sidebar.groups.schedule'), url: '#' }],
			// },
			// {
			// 	title: t('sidebar.main.projects'),
			// 	url: '#',
			// 	icon: Dog,
			// 	items: [
			// 		{ title: t('sidebar.projects.cassiaphotos'), url: '#' },
			// 		{ title: t('sidebar.projects.cassianegatives'), url: '#' },
			// 		{ title: t('sidebar.projects.findagrave'), url: '#' },
			// 		{ title: t('sidebar.projects.mccemeteries'), url: '#' },
			// 		{ title: t('sidebar.projects.censuses'), url: '#' },
			// 		{ title: t('sidebar.projects.mvwwii'), url: '#' },
			// 		{ title: t('sidebar.projects.naturalization'), url: '#' },
			// 		{ title: t('sidebar.projects.numident'), url: '#' },
			// 		{ title: t('sidebar.projects.obituaries'), url: '#' },
			// 		{ title: t('sidebar.projects.oral'), url: '#' },
			// 	],
			// },
			// {
			// 	title: t('sidebar.main.digitization'),
			// 	url: '#',
			// 	icon: Camera,
			// 	items: [
			// 		{ title: t('sidebar.digitization.verbs'), url: '#' },
			// 		{ title: t('sidebar.digitization.scramble'), url: '#' },
			// 		{ title: t('sidebar.digitization.builder'), url: '#' },
			// 		{ title: t('sidebar.digitization.memorizer'), url: '#' },
			// 	],
			// },
			{
				title: t('sidebar.main.calendar'),
				url: `/${locale}/calendar`,
				icon: Calendar,
				items: [
					// { title: t('sidebar.calendar.expo'), url: '#' },
					// { title: t('sidebar.calendar.memorylane'), url: '#' },
					// { title: t('sidebar.calendar.classes'), url: '#' },
				],
			},

			{
				title: 'Group Visits',
				url: `/${locale}/groups`,
				icon: Users2,
				items: [],
			},
			{
				title: 'Research Specialists',
				url: `/${locale}/research-specialists`,
				icon: Search,
				items: [],
			},
			{
				title: 'Training Guide',
				url: `/${locale}/training-guide`,
				icon: GraduationCap,
				items: [],
			},
			{
				title: 'Consultant Helps',
				url: `/${locale}/consultant-helps`,
				icon: BadgeQuestionMark,
				items: [],
			},
			{
				title: 'Community Projects',
				url: `/${locale}/community-projects`,
				icon: MapIcon,
				items: [],
			},
			{
				title: 'Memory Lane',
				url: `/${locale}/memory-lane`,
				icon: Camera,
				items: [],
			},
			{
				title: 'Activities',
				url: `/${locale}/activities`,
				icon: Pencil,
				items: [],
			},
			{
				title: 'Newsletters',
				url: `/${locale}/newsletters`,
				icon: Newspaper,
				items: [],
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
		],
		admin: [
			{
				name: t('sidebar.admin.users'),
				url: `/${locale}/admin/users`,
				icon: User,
			},
			{
				name: 'Center Definitions',
				url: `/${locale}/admin/center`,
				icon: Pencil,
			},
			{
				name: 'Schedule Closures',
				url: `/${locale}/admin/kiosk/special-hours`,
				icon: CalendarX,
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
			{
				name: 'Newsletter',
				url: `/${locale}/admin/newsletter`,
				icon: Pencil,
			},
			{
				name: 'Add Book/Equip',
				url: `/${locale}/library/create`,
				icon: PlusCircle,
			},
		],

		consultant: [
			{
				name: t('sidebar.consultant.shiftReport'),
				url: `/${locale}/dashboard/reports/shifts`,
				icon: Users2Icon,
			},
			{
				name: t('sidebar.consultant.teachClass'),
				url: `/${locale}/classes`,
				icon: Lectern,
			},
		],
		patron: [
			{
				title: t('sidebar.cases.title'),
				url: `/${locale}/cases`,
				icon: Ticket,
				items: CASE_VIEWS.map((v) => ({
					title: t(`sidebar.cases.${v.key}`),
					url: `/${locale}/cases?view=${v.key}`,
					badgeKey: v.key,
				})),
			},
			{
				title: t('sidebar.cases.mentions'),
				url: `/${locale}/cases/mentions`,
				icon: AtSign,
				isMentionItem: true,
				items: [],
			},
			{
				title: t('sidebar.consultant.library'),
				url: `/${locale}/library`,
				icon: Book,
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
