'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ResourceItemsDesktopTable } from './ResourceItemsDesktopTable'
import { useTranslations } from 'next-intl'
import { Resource } from '@/types/resource'

interface Props {
	grouped: Record<Resource['type'], Resource[]>
	locale: string
}

export function ResourceItemsDesktopCards({ grouped, locale }: Props) {
	const t = useTranslations('common')

	return (
		<div className="space-y-6">
			{(['equipment', 'room', 'booth', 'activity'] as Resource['type'][]).map(
				(type) => {
					const items = grouped[type]
					if (!items.length) return null

					return (
						<Card key={type}>
							<CardHeader>
								<h2 className="font-semibold">
									{t(`resource.typesP.${type}`)}
								</h2>
							</CardHeader>

							<CardContent>
								<ResourceItemsDesktopTable items={items} locale={locale} />
							</CardContent>
						</Card>
					)
				}
			)}
		</div>
	)
}
