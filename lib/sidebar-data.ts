import {
	GraduationCap,
	Pencil,
	Trophy,
	Calendar,
	LifeBuoy,
	Send,
	LetterText,
	Camera,
	Search,
	User,
	Megaphone,
	Users2Icon,
	CalendarX,
	Lectern,
	Ticket,
	AtSign,
	Book,
	Users2,
	BadgeQuestionMark,
	MapIcon,
	Newspaper,
	PlusCircle,
	ArrowRightLeft,
	CalendarCheck,
} from 'lucide-react'
import type { TFunction } from '@/types/i18n'
import { CASE_VIEWS } from '@/lib/cases/views'

export function buildSidebarData(t: TFunction, locale: string) {
	return {
		navMain: [
			{
				title: t('sidebar.main.calendar'),
				url: `/${locale}/calendar`,
				icon: Calendar,
				items: [],
			},

			{
				title: t('sidebar.main.groupVisits'),
				url: `/${locale}/groups`,
				icon: Users2,
				items: [],
			},
			{
				title: t('sidebar.main.researchSpecialists'),
				url: `/${locale}/research-specialists`,
				icon: Search,
				items: [],
			},
			{
				title: t('sidebar.main.trainingGuide'),
				url: `/${locale}/training-guide`,
				icon: GraduationCap,
				items: [],
			},
			{
				title: t('sidebar.main.consultantHelps'),
				url: `/${locale}/consultant-helps`,
				icon: BadgeQuestionMark,
				items: [],
			},
			{
				title: t('sidebar.main.communityProjects'),
				url: `/${locale}/community-projects`,
				icon: MapIcon,
				items: [],
			},
			{
				title: t('sidebar.main.memoryLane'),
				url: `/${locale}/memory-lane`,
				icon: Camera,
				items: [],
			},
			{
				title: t('sidebar.main.activities'),
				url: `/${locale}/activities`,
				icon: Pencil,
				items: [],
			},
			{
				title: t('sidebar.main.newsletters'),
				url: `/${locale}/newsletters`,
				icon: Newspaper,
				items: [],
			},
			{
				title: t('sidebar.consultant.library'),
				url: `/${locale}/library`,
				icon: Book,
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
		admin: [
			{
				name: t('sidebar.admin.users'),
				url: `/${locale}/admin/users`,
				icon: User,
			},
			{
				name: t('sidebar.admin.centerDefinitions'),
				url: `/${locale}/admin/center`,
				icon: Pencil,
			},
			{
				name: t('sidebar.admin.scheduleClosures'),
				url: `/${locale}/admin/kiosk/special-hours`,
				icon: CalendarX,
			},

			{
				name: t('sidebar.admin.shiftScheduler'),
				url: `/${locale}/shifts/assignments`,
				icon: Calendar,
			},
			{
				name: t('sidebar.admin.announcements'),
				url: `/${locale}/admin/announcements`,
				icon: Megaphone,
			},
			{
				name: t('sidebar.admin.newsletter'),
				url: `/${locale}/admin/newsletter`,
				icon: Pencil,
			},
			{
				name: t('sidebar.admin.addBookEquip'),
				url: `/${locale}/library/create`,
				icon: PlusCircle,
			},
			{
				name: t('sidebar.admin.training'),
				url: `/${locale}/admin/training`,
				icon: GraduationCap,
			},
		],

		consultant: [
			{
				title: t('sidebar.consultant.shiftAssignments'),
				url: `/${locale}/shifts/assignments`,
				icon: Calendar,
			},
			{
				title: t('substitutes.availability.title'),
				url: `/${locale}/substitutes/availability`,
				icon: CalendarCheck,
			},
			{
				title: t('sidebar.consultant.substitutes'),
				url: `/${locale}/substitutes/calendar`,
				icon: ArrowRightLeft,
			},
			{
				title: t('sidebar.consultant.shiftReport'),
				url: `/${locale}/reports/shifts`,
				icon: Users2Icon,
			},
			{
				title: t('sidebar.consultant.teachClass'),
				url: `/${locale}/classes`,
				icon: Lectern,
			},
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
				title: t('sidebar.consultant.training'),
				url: `/${locale}/training`,
				icon: GraduationCap,
				// isMentionItem: true,
				items: [],
			},
		],
		patron: [],

		lesson: [{ name: t('sidebar.lesson.scripts'), url: '#', icon: LetterText }],
	}
}
