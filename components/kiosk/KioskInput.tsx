'use client'

import { Input } from '@/components/ui/input'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type Props = ComponentPropsWithoutRef<typeof Input>

export function KioskInput({ className, ...props }: Props) {
	return (
		<Input {...props} className={cn('h-14 text-lg rounded-xl', className)} />
	)
}
