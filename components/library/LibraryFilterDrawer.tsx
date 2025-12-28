// components/library/LibraryFilterDrawer.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { LibraryFilters } from './LibraryFilters'

interface Props {
	tags: string[]
}

export function LibraryFilterDrawer({ tags }: Props) {
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
						<LibraryFilters tags={tags} />
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
