'use client'
import {
	Calendar,
	CircuitBoard,
	HandHelping,
	House,
	Newspaper,
} from 'lucide-react'
import { useSidebar } from '../ui/sidebar'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function MobileFooter() {
	const { isMobile, openMobile } = useSidebar()
	const { locale } = useParams<{ locale: string }>()
	const t = useTranslations('sidebar.main')
	if (!isMobile || openMobile) return null

	const footerIcons = [
		{
			name: t('home'),
			href: `/${locale}`,
			icon: House,
		},
		{
			name: t('calendar'),
			href: `/${locale}/calendar`,
			icon: Calendar,
		},
		{
			name: t('projects'),
			href: `/${locale}/projects`,
			icon: HandHelping,
		},
		{
			name: t('news'),
			href: `/${locale}/newsletters`,
			icon: Newspaper,
		},
		{
			name: t('dash'),
			href: `/${locale}/dashboard`,
			icon: CircuitBoard,
		},
		// {
		// 	name: 'About',
		// 	href: '/about',
		// 	icon: FaCircleInfo,
		// },
	]

	return (
		<footer className="">
			<div className="fixed bottom-2 left-1/2 -translate-x-1/2 grid grid-cols-5 justify-around py-2 z-20 bg-(--green-logo) w-5/6 rounded-full bg-opacity-95">
				{footerIcons.map((item) => (
					<a href={item.href} key={item.name}>
						<div className="">
							<div className="flex justify-center">
								{
									<item.icon
										className="h-7 w-7 text-white"
										aria-hidden="true"
									/>
								}
							</div>
							<div className="flex justify-center">
								<p className="block text-white text-xs sm:text-sm md:text-md">
									{item.name}
								</p>
							</div>
						</div>
					</a>
				))}
			</div>
		</footer>
	)
}
