'use client'

import { Award } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { cn } from '@/lib/utils'

type BadgeSize = 'sm' | 'md' | 'lg'

type Props = {
	iconName?: string | null
	svgUrl?: string | null
	label?: string
	size?: BadgeSize
	className?: string
}

const shellSize: Record<BadgeSize, string> = {
	sm: 'h-10 w-10',
	md: 'h-14 w-14',
	lg: 'h-20 w-20',
}

const iconSize: Record<BadgeSize, string> = {
	sm: 'h-5 w-5',
	md: 'h-7 w-7',
	lg: 'h-10 w-10',
}

function isLucideIconName(value: string): value is keyof typeof dynamicIconImports {
	return value in dynamicIconImports
}

export function CourseBadgeIcon({
	iconName,
	svgUrl,
	label,
	size = 'md',
	className,
}: Props) {
	return (
		<div
			aria-label={label ?? 'Course badge'}
			className={cn(
				'rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0',
				shellSize[size],
				className
			)}
		>
			{svgUrl ? (
				<div
					className={cn('bg-primary-foreground', iconSize[size])}
					style={{
						maskImage: `url("${svgUrl}")`,
						WebkitMaskImage: `url("${svgUrl}")`,
						maskRepeat: 'no-repeat',
						WebkitMaskRepeat: 'no-repeat',
						maskPosition: 'center',
						WebkitMaskPosition: 'center',
						maskSize: 'contain',
						WebkitMaskSize: 'contain',
					}}
				/>
			) : iconName && isLucideIconName(iconName) ? (
				<DynamicIcon name={iconName} className={iconSize[size]} />
			) : (
				<Award className={iconSize[size]} />
			)}
		</div>
	)
}
