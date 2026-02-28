import { upsertScopedUnitContacts } from '@/app/actions/group-scheduling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	type DirectoryScopeType,
	getRoleTemplatesForScope,
} from '@/lib/group-directory-role-templates'

type WorkspaceData = Awaited<
	ReturnType<typeof import('@/db/queries/group-scheduling').getSchedulingWorkspace>
>

export function GroupDirectoryWorkspace({
	workspace,
	locale,
	stakeId,
	unitSelection,
}: {
	workspace: WorkspaceData
	locale: string
	stakeId?: string
	unitSelection?: string
}) {
	const selectedScope = (() => {
		if (!unitSelection) return null
		const [scopeType, scopeId] = unitSelection.split(':')
		if (!scopeType || !scopeId) return null
		if (scopeType !== 'stake' && scopeType !== 'ward') return null
		return { scopeType: scopeType as DirectoryScopeType, scopeId }
	})()

	const selectedScopeRoles = selectedScope
		? getRoleTemplatesForScope(selectedScope.scopeType)
		: []
	const selectedScopeContacts = selectedScope
		? workspace.contacts.filter((contact) =>
				selectedScope.scopeType === 'stake'
					? contact.stakeId === selectedScope.scopeId
					: contact.wardId === selectedScope.scopeId
			)
		: []

	const contactBuckets = selectedScopeContacts.reduce<
		Record<string, WorkspaceData['contacts']>
	>((acc, contact) => {
		const key = contact.role.trim().toLowerCase()
		if (!key) return acc
		if (!acc[key]) acc[key] = []
		acc[key].push(contact)
		return acc
	}, {})

	const selectedContactByRole = selectedScopeRoles.reduce<
		Record<string, WorkspaceData['contacts'][number]>
	>((acc, role) => {
		const key = role.toLowerCase()
		const matches = contactBuckets[key] ?? []
		if (matches.length > 0) acc[key] = matches[0]
		return acc
	}, {})

	const templateRoleSet = new Set(selectedScopeRoles.map((role) => role.toLowerCase()))
	const _extraPrefilledContacts = selectedScopeContacts.filter((contact) => {
		const key = contact.role.trim().toLowerCase()
		if (!key) return false
		if (!templateRoleSet.has(key)) return true
		const first = selectedContactByRole[key]
		return Boolean(first && first.id !== contact.id)
	})

	const selectedScopeLabel = selectedScope
		? selectedScope.scopeType === 'stake'
			? workspace.stakes.find((stake) => stake.id === selectedScope.scopeId)?.name
			: workspace.wards.find((ward) => ward.id === selectedScope.scopeId)?.name
		: null

	const basePath = `/${locale}/admin/groups/directory`
	const clearFiltersHref = unitSelection
		? `${basePath}?unitSelection=${encodeURIComponent(unitSelection)}`
		: basePath
	const clearScopeHref = stakeId
		? `${basePath}?stakeId=${encodeURIComponent(stakeId)}`
		: basePath

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Directory Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="flex flex-wrap items-end gap-3">
						{unitSelection ? (
							<input type="hidden" name="unitSelection" value={unitSelection} />
						) : null}
						<div className="space-y-2 min-w-64">
							<Label>Stake</Label>
							<select
								name="stakeId"
								defaultValue={stakeId ?? ''}
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">All stakes</option>
								{workspace.stakes.map((stake) => (
									<option key={stake.id} value={stake.id}>
										{stake.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex gap-2">
							<Button type="submit">Apply</Button>
							<a href={clearFiltersHref}>
								<Button type="button" variant="outline">
									Clear
								</Button>
							</a>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stake and Ward Contact Directory</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<form className="grid gap-4 lg:grid-cols-4">
						{stakeId ? <input type="hidden" name="stakeId" value={stakeId} /> : null}
						<div className="space-y-2 lg:col-span-3">
							<Label htmlFor="unitSelection">Unit (stake or ward)</Label>
							<select
								id="unitSelection"
								name="unitSelection"
								defaultValue={unitSelection ?? ''}
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
								required
							>
								<option value="">Select stake or ward</option>
								<optgroup label="Stakes">
									{workspace.stakes.map((stake) => (
										<option key={`stake-${stake.id}`} value={`stake:${stake.id}`}>
											Stake: {stake.name}
										</option>
									))}
								</optgroup>
								<optgroup label="Wards">
									{workspace.wards.map((ward) => (
										<option key={`ward-${ward.id}`} value={`ward:${ward.id}`}>
											Ward: {ward.stakeName} - {ward.name}
										</option>
									))}
								</optgroup>
							</select>
						</div>
						<div className="flex items-end gap-2">
							<Button type="submit">Load Callings</Button>
							<a href={clearScopeHref}>
								<Button type="button" variant="outline">
									Clear
								</Button>
							</a>
						</div>
					</form>

					{selectedScope ? (
						<form action={upsertScopedUnitContacts} className="space-y-3 rounded-md border p-3">
							<input type="hidden" name="locale" value={locale} />
							<input type="hidden" name="scopeType" value={selectedScope.scopeType} />
							<input type="hidden" name="scopeId" value={selectedScope.scopeId} />
							<div className="text-sm text-muted-foreground">
								Editing {selectedScope.scopeType} callings for{' '}
								<span className="font-medium text-foreground">{selectedScopeLabel ?? 'selected unit'}</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Fill only the rows you have. Preferred method stays blank until you choose one.
							</p>
							<div className="overflow-x-auto rounded-md border">
								<table className="min-w-[1100px] w-full border-collapse text-sm">
									<thead className="bg-muted/30">
										<tr className="border-b">
											<th className="px-3 py-2 text-left font-medium">Calling</th>
											<th className="px-3 py-2 text-left font-medium">Name</th>
											<th className="px-3 py-2 text-left font-medium">Phone</th>
											<th className="px-3 py-2 text-left font-medium">Email</th>
											<th className="px-3 py-2 text-left font-medium">Preferred</th>
											<th className="px-3 py-2 text-left font-medium">Primary</th>
											<th className="px-3 py-2 text-left font-medium">Public</th>
										</tr>
									</thead>
									<tbody>
										{selectedScopeRoles.map((role, index) => {
											const existing = selectedContactByRole[role.toLowerCase()]
											return (
												<tr key={role} className="border-b align-top last:border-b-0">
													<td className="px-3 py-2 font-medium">
														<input
															type="hidden"
															name={`id_${index}`}
															value={existing?.id ?? ''}
														/>
														{role}
													</td>
													<td className="px-3 py-2">
														<Input name={`name_${index}`} defaultValue={existing?.name ?? ''} />
													</td>
													<td className="px-3 py-2">
														<Input name={`phone_${index}`} defaultValue={existing?.phone ?? ''} />
													</td>
													<td className="px-3 py-2">
														<Input
															name={`email_${index}`}
															type="email"
															defaultValue={existing?.email ?? ''}
														/>
													</td>
													<td className="px-3 py-2">
														<select
															name={`preferredContactMethod_${index}`}
															defaultValue={existing?.preferredContactMethod ?? ''}
															className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
														>
															<option value="">Select method</option>
															<option value="phone">Phone</option>
															<option value="text">Text</option>
															<option value="email">Email</option>
														</select>
													</td>
													<td className="px-3 py-2">
														<label className="inline-flex items-center gap-2 text-sm">
															<input
																type="checkbox"
																name={`isPrimary_${index}`}
																defaultChecked={existing?.isPrimary ?? false}
															/>
															Yes
														</label>
													</td>
													<td className="px-3 py-2">
														<label className="inline-flex items-center gap-2 text-sm">
															<input
																type="checkbox"
																name={`isPublic_${index}`}
																defaultChecked={existing?.isPublic ?? false}
															/>
															Yes
														</label>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>

							<Button type="submit">Save Calling Contacts</Button>
						</form>
					) : (
						<p className="text-sm text-muted-foreground">
							Select a stake or ward to load all calling fields.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
