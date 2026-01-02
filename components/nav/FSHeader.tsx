'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

export default function FSHeader() {
	return (
		<header className="md:hidden sticky top-0 z-40 bg-(--green-logo)">
			<div className="flex h-14 items-center justify-between px-4">
				{/* Centered title */}
				<div className="flex-1 text-center">
					<span className="text-white text-md font-semibold tracking-wide">
						Burley FamilySearch Center
					</span>
				</div>

				{/* Hamburger menu */}
				<div className="absolute right-2">
					<SidebarTrigger className="text-white hover:bg-white/10" />
				</div>
			</div>
		</header>
	)
}
