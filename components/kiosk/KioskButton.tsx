'use client'

import { Button } from '@/components/ui/button'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type Props = ComponentPropsWithoutRef<typeof Button>

export function KioskButton({ className, ...props }: Props) {
	return (
		<Button
			{...props}
			className={cn('h-14 text-lg rounded-xl w-full', className)}
		/>
	)
}
