// app/[locale]/(public)/memory-lane/page.tsx
import { MemoryLaneResources } from '@/components/resource/MemoryLaneResources'
import { readAllResources } from '@/lib/actions/resource/resource'
import { getFaithTree } from '@/db/queries/faiths'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Resource } from '@/types/resource'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function MemoryLanePage({ params }: Props) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const { items } = await readAllResources({
		type: 'equipment',
		page: 1,
		pageSize: 200,
	})
	const { items: reservationItems } = await readAllResources({
		page: 1,
		pageSize: 200,
	})
	const centerTime = await getCenterTimeConfig()
	const faithTree = await getFaithTree()

	// public page: only active
	const active = items.filter((r) => r.isActive)
	const reservationResources = reservationItems.map((r) => ({
		...r,
		type: r.type as Resource['type'],
	}))

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Memory Lane</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Digitizing options available at the Burley FamilySearch Center to
					preserve photos, film, audio, and video.
				</p>
			</div>

			<MemoryLaneResources
				items={active}
				locale={locale}
				reservationData={{
					resources: reservationResources,
					faithTree,
					timeFormat: centerTime.timeFormat,
				}}
				canReserve={Boolean(session)}
				loginHref={`/${locale}/login?redirect=/${locale}/memory-lane`}
			/>
		</div>
	)
}
