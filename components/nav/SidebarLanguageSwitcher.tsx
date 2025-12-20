'use client'

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from '@/components/ui/sidebar'

import { LANGUAGES } from '@/i18n/languages'
import { usePathname, useRouter } from 'next/navigation'
import { setLocale } from '@/app/actions/set-locale'
import { startTransition } from 'react'
import { Globe } from 'lucide-react'

export function SidebarLanguageSwitcher({
	locale,
	label,
	choose,
}: {
	locale: string
	label: string
	choose: string
}) {
	const router = useRouter()
	const pathname = usePathname()
	const locales = Object.keys(LANGUAGES)

	async function handleChange(nextLocale: string) {
		if (!pathname) return

		await setLocale(nextLocale)

		const segments = pathname.split('/')
		segments[1] = nextLocale

		startTransition(() => {
			router.push(segments.join('/') || '/')
		})
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="lg">
							<Globe className="size-4" />
							<span className="flex-1 text-left text-sm">{label}</span>
						</SidebarMenuButton>
					</DropdownMenuTrigger>

					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width)"
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel>{choose}</DropdownMenuLabel>

						{locales.map((loc) => (
							<DropdownMenuItem
								key={loc}
								onClick={() => handleChange(loc)}
								className={locale === loc ? 'font-semibold text-xl' : 'text-lg'}
							>
								<span className={`fi ${LANGUAGES[loc].flag} mr-2`} />
								{LANGUAGES[loc].label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
