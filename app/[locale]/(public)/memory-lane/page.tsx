// app/[locale]/(public)/memory-lane/page.tsx
import { MemoryLaneResources } from '@/components/resource/MemoryLaneResources'
import { readAllResources } from '@/lib/actions/resource/resource'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function MemoryLanePage({ params }: Props) {
	const { locale } = await params
	const { items } = await readAllResources({
		type: 'equipment',
		page: 1,
		pageSize: 200,
	})

	// public page: only active
	const active = items.filter((r) => r.isActive)

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Memory Lane</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Digitizing options available at the Burley FamilySearch Center to
					preserve photos, film, audio, and video.
				</p>
			</div>

			<MemoryLaneResources items={active} locale={locale} />
		</div>
	)
}
