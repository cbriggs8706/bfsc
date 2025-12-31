'use client'

import { Input } from '@/components/ui/input'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type Props = ComponentPropsWithoutRef<typeof Input>

export function KioskInput({ className, ...props }: Props) {
	return (
		<Input
			{...props}
			readOnly
			inputMode="none"
			autoComplete="off"
			autoCorrect="off"
			spellCheck={false}
			onFocus={(e) => e.target.blur()} // prevents iOS soft keyboard
			className={cn('h-14 text-lg rounded-xl caret-transparent', className)}
		/>
	)
}
