// components/library/LibraryFilterDrawer.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { LibraryFilters } from './LibraryFilters'

export function LibraryFilterDrawer() {
	return (
		<div className="md:hidden">
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="outline" className="w-full">
						Filter & Search
					</Button>
				</SheetTrigger>

				<SheetContent side="bottom">
					<SheetHeader>
						<SheetTitle>Filter library</SheetTitle>
					</SheetHeader>

					<div className="mt-4">
						<LibraryFilters />
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
