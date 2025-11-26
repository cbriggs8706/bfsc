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
} from 'lucide-react'
import type { TFunction } from '@/types/i18n'

export function buildSidebarData(t: TFunction, locale: string) {
	return {
		navMain: [
			{
				title: t('sidebar.main.courses'),
				url: `/${locale}/courses`,
				icon: GraduationCap,
				items: [
					{ title: t('sidebar.courses.bh'), url: '#' },
					{ title: t('sidebar.courses.bg'), url: '#' },
					{ title: t('sidebar.courses.mh'), url: '#' },
					{ title: t('sidebar.courses.me'), url: '#' },
					{ title: t('sidebar.courses.ms'), url: '#' },
					{ title: t('sidebar.courses.bookclub'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.vocabulary'),
				url: '#',
				icon: Apple,
				items: [
					{ title: t('sidebar.vocabulary.flashcards'), url: '#' },
					{ title: t('sidebar.vocabulary.dictionary'), url: '#' },
					{ title: t('sidebar.vocabulary.learn'), url: '#' },
					{ title: t('sidebar.vocabulary.matching'), url: '#' },
					{ title: t('sidebar.vocabulary.spelling'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.grammar'),
				url: '#',
				icon: Bot,
				items: [
					{ title: t('sidebar.grammar.verbs'), url: '#' },
					{ title: t('sidebar.grammar.scramble'), url: '#' },
					{ title: t('sidebar.grammar.builder'), url: '#' },
					{ title: t('sidebar.grammar.memorizer'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.alphabet'),
				url: '#',
				icon: Pencil,
				items: [
					{ title: t('sidebar.alphabet.names'), url: '#' },
					{ title: t('sidebar.alphabet.sounds'), url: '#' },
					{ title: t('sidebar.alphabet.syllables'), url: '#' },
					{ title: t('sidebar.alphabet.niqqud'), url: '#' },
				],
			},
			{
				title: t('sidebar.main.numbers'),
				url: '#',
				icon: Tally5,
				items: [
					{ title: t('sidebar.numbers.cardinal'), url: '#' },
					{ title: t('sidebar.numbers.ordinal'), url: '#' },
					{ title: t('sidebar.numbers.construct'), url: '#' },
				],
			},
		],

		navSecondary: [
			{ title: t('sidebar.secondary.leaderboard'), url: '#', icon: Trophy },
			{ title: t('sidebar.secondary.calendar'), url: '#', icon: Calendar },
			{ title: t('sidebar.secondary.help'), url: '#', icon: LifeBuoy },
			{ title: t('sidebar.secondary.feedback'), url: '#', icon: Send },
		],

		input: [
			{ name: t('sidebar.input.songs'), url: '#', icon: Music },
			{ name: t('sidebar.input.stories'), url: '#', icon: BookOpen },
			{ name: t('sidebar.input.scriptures'), url: '#', icon: BookKey },
			{ name: t('sidebar.input.prayers'), url: '#', icon: HandHeart },
		],

		lesson: [
			{ name: t('sidebar.lesson.scripts'), url: '#', icon: LetterText },
			{ name: t('sidebar.lesson.grammarLessons'), url: '#', icon: Text },
		],
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
