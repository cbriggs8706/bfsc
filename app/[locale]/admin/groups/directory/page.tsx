import { GroupDirectoryWorkspace } from '@/components/admin/groups/GroupDirectoryWorkspace'
import { getSchedulingWorkspace } from '@/db/queries/group-scheduling'
import { requireRole } from '@/utils/require-role'

export default async function GroupDirectoryPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>
	searchParams: Promise<{ stakeId?: string }>
}) {
	const { locale } = await params
	const { stakeId } = await searchParams

	await requireRole(locale, ['Admin', 'Director', 'Assistant Director'], `/${locale}`)
	const workspace = await getSchedulingWorkspace()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Stake/Ward Directory</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Manage stake and ward contacts, verify records, and keep the planning
					directory ready for group visits.
				</p>
			</div>

			<GroupDirectoryWorkspace workspace={workspace} locale={locale} stakeId={stakeId} />
		</div>
	)
}
