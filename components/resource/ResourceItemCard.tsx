'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Resource } from '@/types/resource'

interface Props {
	item: Resource
	locale: string
}

export function ResourceItemCard({ item, locale }: Props) {
	const router = useRouter()
	const t = useTranslations('common')

	return (
		<Card className="p-4 flex flex-row justify-between">
			<div>
				<div
					className="text-lg font-semibold cursor-pointer"
					onClick={() =>
						router.push(`/${locale}/admin/center/resources/${item.id}`)
					}
				>
					{item.name}
				</div>

				<div className="flex gap-2 items-center">
					<span className="text-sm text-muted-foreground">
						{t(`resource.types.${item.type}`)}
					</span>
					{/* <Badge variant={item.isActive ? 'default' : 'secondary'}>
					{item.isActive ? t('active') : t('inactive')}
				</Badge> */}
				</div>
			</div>
			<div className="flex gap-4 pt-2">
				<Button size="sm" variant="outline" asChild>
					<Link href={`/${locale}/admin/center/resources/update/${item.id}`}>
						{t('edit')}
					</Link>
				</Button>

				<Button size="sm" variant="destructive" asChild>
					<Link href={`/${locale}/admin/center/resources/delete/${item.id}`}>
						{t('delete')}
					</Link>
				</Button>
			</div>
		</Card>
	)
}
