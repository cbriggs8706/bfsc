import {
	GraduationCap,
	Pencil,
	Calendar,
	Camera,
	Search,
	User,
	Megaphone,
	Lectern,
	Ticket,
	AtSign,
	Users2,
	BadgeQuestionMark,
	MapIcon,
	Newspaper,
	PlusCircle,
	CalendarCheck,
	CalendarRange,
	CalendarPlus,
	Files,
	HandHeart,
	HandHelping,
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
				url: `/${locale}/projects`,
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
				title: t('sidebar.admin.reservations'),
				url: `/${locale}/reservation`,
				icon: CalendarPlus,
			},
		],

		patron: [],

		worker: [
			{
				title: t('sidebar.worker.shifts'),
				url: `/${locale}/shifts/assignments`,
				icon: Calendar,
				items: [
					{
						title: t('sidebar.worker.assignments'),
						url: `/${locale}/shifts/assignments`,
					},
					{
						title: t('sidebar.worker.substitutes'),
						url: `/${locale}/substitutes/calendar`,
					},
					{
						title: t('sidebar.worker.availability'),
						url: `/${locale}/substitutes/availability`,
					},
					{
						title: t('sidebar.worker.shiftReport'),
						url: `/${locale}/shifts/reports`,
					},
				],
			},

			{
				title: t('sidebar.worker.teachClass'),
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
				title: t('sidebar.worker.training'),
				url: `/${locale}/training`,
				icon: GraduationCap,
				// isMentionItem: true,
				items: [],
			},
		],
		admin: [
			{
				title: t('sidebar.admin.users'),
				url: `/${locale}/admin/users`,
				icon: User,
				items: [
					{
						title: t('sidebar.admin.shiftScheduler'),
						url: `/${locale}/shifts/assignments`,
					},
					{
						title: t('sidebar.admin.rolePermissions'),
						url: `/${locale}/admin/users/permissions/roles`,
					},
					{
						title: t('sidebar.admin.userPermissions'),
						url: `/${locale}/admin/users/permissions/users`,
					},
				],
			},
			{
				title: t('sidebar.admin.centerDefinitions'),
				url: `/${locale}/admin/center`,
				icon: Pencil,
				items: [
					{
						title: t('sidebar.admin.defineHours'),
						url: `/${locale}/admin/center/hours`,
					},
					{
						title: t('sidebar.admin.defineShifts'),
						url: `/${locale}/admin/center/shifts`,
					},
					{
						title: t('sidebar.admin.definePurposes'),
						url: `/${locale}/admin/center/purposes`,
					},
					{
						title: t('sidebar.admin.defineCaseTypes'),
						url: `/${locale}/admin/center/case-types`,
					},
					{
						title: t('sidebar.admin.defineFaiths'),
						url: `/${locale}/admin/center/faiths`,
					},
					{
						title: t('sidebar.admin.defineCallings'),
						url: `/${locale}/admin/center/faiths/callings`,
					},
					{
						title: t('sidebar.admin.resources'),
						url: `/${locale}/admin/center/resources`,
						icon: PlusCircle,
					},
					{
						title: t('sidebar.admin.scheduleClosures'),
						url: `/${locale}/admin/center/special-hours`,
					},
				],
			},

			{
				title: t('sidebar.admin.announcements'),
				url: `/${locale}/admin/announcements`,
				icon: Megaphone,
			},
			{
				title: t('sidebar.admin.newsletter'),
				url: `/${locale}/admin/newsletter`,
				icon: Pencil,
			},

			{
				title: t('sidebar.admin.reservations'),
				url: `/${locale}/admin/reservation`,
				icon: CalendarCheck,
			},
			{
				title: t('sidebar.admin.groupScheduler'),
				url: `/${locale}/admin/groups/scheduler`,
				icon: CalendarRange,
			},
			{
				title: t('sidebar.admin.projects'),
				url: `/${locale}/admin/projects`,
				icon: HandHelping,
			},
			{
				title: t('sidebar.admin.training'),
				url: `/${locale}/admin/training`,
				icon: GraduationCap,
			},
		],
	}
}
