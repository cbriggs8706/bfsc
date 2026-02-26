import {
	deleteUnitContact,
	markContactAsVerified,
	upsertUnitContact,
} from '@/app/actions/group-scheduling'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'

type WorkspaceData = Awaited<
	ReturnType<typeof import('@/db/queries/group-scheduling').getSchedulingWorkspace>
>

const wardRoleTemplates = [
	'Bulletin',
	'Email Newsletter',
	'Tech Specialist',
	'TFH Leader',
	'TFH Consultant',
	'JustServe',
	'Facebook & Website',
	'Ward Mission Leader',
	'Singles 35+ Representative',
	'Bishop',
	'Relief Society President',
	'Young Womens President',
	'Primary President',
	'Self Reliance',
]

const stakeRoleTemplates = [
	'Stake President',
	'Stake 1st Councelor',
	'Stake 2nd Councelor',
	'Stake Relief Society President',
	'Stake Communications',
	'Stake Singles 35+ Representative',
	'Stake Technology Specialist',
	'Stake Executive Secretary',
	'Stake TFH High Councilman',
]

const contactRoleTemplates = [...wardRoleTemplates, ...stakeRoleTemplates]
const criticalRoleKeywords = ['assistant director', 'temple and family history']

function stakeColor(stakeId: string, sortedStakeIds: string[]) {
	const classes = [
		'bg-(--blue-accent-soft) border-(--blue-accent)',
		'bg-(--green-accent-soft) border-(--green-accent)',
		'bg-(--orange-accent-soft) border-(--orange-accent)',
		'bg-(--purple-accent-soft) border-(--purple-accent)',
		'bg-(--red-accent-soft) border-(--red-accent)',
		'bg-(--gray-accent-soft) border-(--gray-accent)',
	]
	const idx = sortedStakeIds.findIndex((id) => id === stakeId)
	return classes[idx >= 0 ? idx % classes.length : 0]
}

export function GroupDirectoryWorkspace({
	workspace,
	locale,
	stakeId,
}: {
	workspace: WorkspaceData
	locale: string
	stakeId?: string
}) {
	const filteredContacts = workspace.contacts.filter((contact) => {
		if (!stakeId) return true
		return contact.stakeId === stakeId
	})

	const sortedStakeIds = workspace.stakes.map((stake) => stake.id)
	const stakeContactsMap = workspace.contacts.reduce<
		Record<string, WorkspaceData['contacts']>
	>((acc, contact) => {
		if (!contact.stakeId) return acc
		if (!acc[contact.stakeId]) acc[contact.stakeId] = []
		acc[contact.stakeId].push(contact)
		return acc
	}, {})

	const now = Date.now()
	const staleDays = 180
	const stakeReadiness = workspace.stakes.map((stake) => {
		const contacts = stakeContactsMap[stake.id] ?? []
		const staleCount = contacts.filter((contact) => {
			if (!contact.lastVerifiedAt) return true
			const diff = now - new Date(contact.lastVerifiedAt).getTime()
			return diff > staleDays * 24 * 60 * 60 * 1000
		}).length

		const normalizedRoles = contacts.map((contact) => contact.role.toLowerCase())
		const missingCritical = criticalRoleKeywords.filter(
			(keyword) => !normalizedRoles.some((role) => role.includes(keyword))
		)

		return {
			stakeId: stake.id,
			stakeName: stake.name,
			totalContacts: contacts.length,
			staleCount,
			missingCritical,
		}
	})

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Directory Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="flex flex-wrap items-end gap-3">
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
							<a href={`/${locale}/admin/groups/directory`}>
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
					<CardTitle>Directory Readiness</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{stakeReadiness.map((item) => (
						<div
							key={item.stakeId}
							className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 text-sm"
						>
							<Badge
								variant="outline"
								className={stakeColor(item.stakeId, sortedStakeIds)}
							>
								{item.stakeName}
							</Badge>
							<Badge variant="secondary">{item.totalContacts} contacts</Badge>
							{item.staleCount > 0 ? (
								<Badge variant="outline">{item.staleCount} stale</Badge>
							) : (
								<Badge variant="outline">Fresh</Badge>
							)}
							{item.missingCritical.length > 0 ? (
								<Badge variant="destructive">
									Missing: {item.missingCritical.join(', ')}
								</Badge>
							) : (
								<Badge variant="outline">Key roles covered</Badge>
							)}
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stake and Ward Contact Directory</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<form action={upsertUnitContact} className="grid gap-4 lg:grid-cols-4">
						<input type="hidden" name="locale" value={locale} />
						<div className="space-y-2">
							<Label htmlFor="contact-stakeId">Stake</Label>
							<select
								id="contact-stakeId"
								name="stakeId"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">No stake selected</option>
								{workspace.stakes.map((stake) => (
									<option key={stake.id} value={stake.id}>
										{stake.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-wardId">Ward</Label>
							<select
								id="contact-wardId"
								name="wardId"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">No ward selected</option>
								{workspace.wards.map((ward) => (
									<option key={ward.id} value={ward.id}>
										{ward.stakeName}: {ward.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-role">Role</Label>
							<Input
								id="contact-role"
								name="role"
								list="contact-role-templates"
								placeholder="Stake Technology Specialist"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-name">Name</Label>
							<Input id="contact-name" name="name" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-phone">Phone</Label>
							<Input id="contact-phone" name="phone" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-email">Email</Label>
							<Input id="contact-email" name="email" type="email" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-method">Preferred method</Label>
							<select
								id="contact-method"
								name="preferredContactMethod"
								defaultValue="phone"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="phone">Phone</option>
								<option value="text">Text</option>
								<option value="email">Email</option>
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-best">Best contact times</Label>
							<Input id="contact-best" name="bestContactTimes" placeholder="Evenings after 6:30 PM" />
						</div>
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="contact-notes">Notes</Label>
							<Textarea id="contact-notes" name="notes" rows={2} />
						</div>
						<div className="flex items-center gap-6 lg:col-span-2">
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" name="isPrimary" />
								Primary contact
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" name="isPublic" />
								Show publicly on Group Visits page
							</label>
						</div>
						<div className="lg:col-span-4">
							<Button type="submit">Add Contact</Button>
						</div>
					</form>

					<div className="space-y-3">
						{filteredContacts.length === 0 ? (
							<p className="text-sm text-muted-foreground">No contacts yet.</p>
						) : null}
						{filteredContacts.map((contact) => (
							<form key={contact.id} action={upsertUnitContact} className="rounded-md border bg-card p-3">
								<input type="hidden" name="locale" value={locale} />
								<input type="hidden" name="id" value={contact.id} />
								<div className="grid gap-3 md:grid-cols-3">
									<div className="space-y-2">
										<Label>Stake</Label>
										<select
											name="stakeId"
											defaultValue={contact.stakeId ?? ''}
											className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
										>
											<option value="">No stake selected</option>
											{workspace.stakes.map((stake) => (
												<option key={stake.id} value={stake.id}>
													{stake.name}
												</option>
											))}
										</select>
									</div>
									<div className="space-y-2">
										<Label>Ward</Label>
										<select
											name="wardId"
											defaultValue={contact.wardId ?? ''}
											className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
										>
											<option value="">No ward selected</option>
											{workspace.wards.map((ward) => (
												<option key={ward.id} value={ward.id}>
													{ward.stakeName}: {ward.name}
												</option>
											))}
										</select>
									</div>
									<div className="space-y-2">
										<Label>Role</Label>
										<Input name="role" list="contact-role-templates" defaultValue={contact.role} required />
									</div>
									<div className="space-y-2">
										<Label>Name</Label>
										<Input name="name" defaultValue={contact.name} required />
									</div>
									<div className="space-y-2">
										<Label>Phone</Label>
										<Input name="phone" defaultValue={contact.phone ?? ''} />
									</div>
									<div className="space-y-2">
										<Label>Email</Label>
										<Input name="email" type="email" defaultValue={contact.email ?? ''} />
									</div>
									<div className="space-y-2">
										<Label>Preferred method</Label>
										<select
											name="preferredContactMethod"
											defaultValue={contact.preferredContactMethod}
											className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
										>
											<option value="phone">Phone</option>
											<option value="text">Text</option>
											<option value="email">Email</option>
										</select>
									</div>
									<div className="space-y-2">
										<Label>Best contact times</Label>
										<Input name="bestContactTimes" defaultValue={contact.bestContactTimes ?? ''} />
									</div>
									<div className="space-y-2 md:col-span-3">
										<Label>Notes</Label>
										<Textarea name="notes" defaultValue={contact.notes ?? ''} rows={2} />
									</div>
									<div className="md:col-span-3 flex flex-wrap items-center gap-4">
										<label className="flex items-center gap-2 text-sm">
											<input type="checkbox" name="isPrimary" defaultChecked={contact.isPrimary} />
											Primary contact
										</label>
										<label className="flex items-center gap-2 text-sm">
											<input type="checkbox" name="isPublic" defaultChecked={contact.isPublic} />
											Public
										</label>
										<span className="text-xs text-muted-foreground">
											Last verified: {contact.lastVerifiedAt ? format(contact.lastVerifiedAt, 'MMM d, yyyy') : 'Never'}
										</span>
									</div>
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									<Button type="submit" size="sm">
										Save Contact
									</Button>
									<Button type="submit" formAction={markContactAsVerified} variant="outline" size="sm">
										Mark Verified
									</Button>
									<Button type="submit" formAction={deleteUnitContact} variant="destructive" size="sm">
										Delete
									</Button>
								</div>
							</form>
						))}
					</div>
				</CardContent>
			</Card>

			<datalist id="contact-role-templates">
				{contactRoleTemplates.map((role) => (
					<option key={role} value={role} />
				))}
			</datalist>
		</div>
	)
}
