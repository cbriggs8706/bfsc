import type { IconName } from 'lucide-react/dynamic'

export type CourseBadgeIconOption = {
	value: IconName
	label: string
}

export type CourseBadgeIconGroup = {
	key: string
	label: string
	icons: CourseBadgeIconOption[]
}

export const COURSE_BADGE_ICON_GROUPS: CourseBadgeIconGroup[] = [
	{
		key: 'account',
		label: 'Account',
		icons: [
			{ value: 'user', label: 'User' },
			{ value: 'user-check', label: 'User Check' },
			{ value: 'id-card', label: 'ID Card' },
			{ value: 'shield-check', label: 'Shield Check' },
		],
	},
	{
		key: 'navigating-fs',
		label: 'Navigating FS (FamilySearch)',
		icons: [
			{ value: 'compass', label: 'Compass' },
			{ value: 'map', label: 'Map' },
			{ value: 'navigation', label: 'Navigation' },
			{ value: 'route', label: 'Route' },
		],
	},
	{
		key: 'editing-on-fs',
		label: 'Editing on FS',
		icons: [
			{ value: 'edit', label: 'Edit' },
			{ value: 'pencil', label: 'Pencil' },
			{ value: 'file-edit', label: 'File Edit' },
			{ value: 'pen-line', label: 'Pen Line' },
		],
	},
	{
		key: 'sources',
		label: 'Sources',
		icons: [
			{ value: 'book-open', label: 'Book Open' },
			{ value: 'library', label: 'Library' },
			{ value: 'file-text', label: 'File Text' },
			{ value: 'scroll-text', label: 'Scroll Text' },
		],
	},
	{
		key: 'merging',
		label: 'Merging',
		icons: [
			{ value: 'git-merge', label: 'Git Merge' },
			{ value: 'combine', label: 'Combine' },
			{ value: 'shuffle', label: 'Shuffle' },
			{ value: 'link', label: 'Link' },
		],
	},
	{
		key: 'temple-ordinances',
		label: 'Temple Ordinances',
		icons: [
			{ value: 'landmark', label: 'Landmark' },
			{ value: 'church', label: 'Church' },
			{ value: 'heart', label: 'Heart' },
			{ value: 'sparkles', label: 'Sparkles' },
		],
	},
	{
		key: 'memories',
		label: 'Memories',
		icons: [
			{ value: 'image', label: 'Image' },
			{ value: 'camera', label: 'Camera' },
			{ value: 'album', label: 'Album' },
			{ value: 'heart', label: 'Heart' },
		],
	},
	{
		key: 'descendancy',
		label: 'Descendancy',
		icons: [
			{ value: 'tree-pine', label: 'Tree' },
			{ value: 'git-branch', label: 'Git Branch' },
			{ value: 'network', label: 'Network' },
			{ value: 'share-2', label: 'Share 2' },
		],
	},
	{
		key: 'misc',
		label: 'Misc',
		icons: [
			{ value: 'puzzle', label: 'Puzzle' },
			{ value: 'tool-case', label: 'Tool' },
			{ value: 'grid-2x2', label: 'Grid 2x2' },
			{ value: 'layers', label: 'Layers' },
		],
	},
	{
		key: 'memory-lane',
		label: 'Memory Lane',
		icons: [
			{ value: 'clock', label: 'Clock' },
			{ value: 'history', label: 'History' },
			{ value: 'hourglass', label: 'Hourglass' },
			{ value: 'calendar-days', label: 'Calendar Days' },
		],
	},
	{
		key: 'computers',
		label: 'Computers',
		icons: [
			{ value: 'monitor', label: 'Monitor' },
			{ value: 'laptop', label: 'Laptop' },
			{ value: 'cpu', label: 'CPU' },
			{ value: 'keyboard', label: 'Keyboard' },
		],
	},
	{
		key: 'burley',
		label: 'Burley (Local Center / Community)',
		icons: [
			{ value: 'map-pin', label: 'Map Pin' },
			{ value: 'home', label: 'Home' },
			{ value: 'building', label: 'Building' },
			{ value: 'users', label: 'Users' },
		],
	},
] 

export const COURSE_BADGE_ICON_OPTIONS: CourseBadgeIconOption[] =
	COURSE_BADGE_ICON_GROUPS.flatMap(
	(group) => group.icons
)

export const DEFAULT_COURSE_BADGE_ICON =
	COURSE_BADGE_ICON_OPTIONS[0]?.value ?? 'user'

export type CourseBadgeIconName = IconName

const courseBadgeIconNameSet = new Set<string>(
	COURSE_BADGE_ICON_OPTIONS.map((icon) => icon.value)
)

export function isCourseBadgeIconName(
	value: string
): value is CourseBadgeIconName {
	return courseBadgeIconNameSet.has(value)
}
