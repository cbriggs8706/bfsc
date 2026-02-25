import { GroupSchedulerWorkspace } from '@/components/admin/groups/GroupSchedulerWorkspace'
import { getSchedulingWorkspace } from '@/db/queries/group-scheduling'
import { requireRole } from '@/utils/require-role'

export default async function GroupSchedulerPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>
	searchParams: Promise<{
		stakeId?: string
		status?: string
		coordinationStatus?: string
		assignment?: string
	}>
}) {
	const { locale } = await params
	const filters = await searchParams
	const user = await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}`
	)

	const workspace = await getSchedulingWorkspace()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Stake/Ward Scheduling</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Collaborative planning workspace for assistant directors. Create and
					adjust events, track outreach status, and maintain a shared contact
					directory for stakes and wards.
				</p>
			</div>

			<GroupSchedulerWorkspace
				workspace={workspace}
				locale={locale}
				filters={filters}
				currentUserId={user.id}
			/>
		</div>
	)
}
