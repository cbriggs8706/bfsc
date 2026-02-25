import {
	clearPrivateEventNotes,
	createGroupScheduleEvent,
	createGroupScheduleNote,
	deleteGroupScheduleEvent,
	deleteUnitContact,
	duplicateGroupScheduleEventNextWeek,
	markContactAsVerified,
	setGroupScheduleEventCoordinationStatus,
	shiftGroupScheduleEventByWeek,
	updateGroupScheduleEvent,
	upsertUnitContact,
} from '@/app/actions/group-scheduling'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	type CoordinationStatus,
	type ScheduleStatus,
	coordinationStatuses,
	scheduleStatuses,
} from '@/db/queries/group-scheduling'
import { format } from 'date-fns'
import { WeeklyRotationBoard } from './WeeklyRotationBoard'

type WorkspaceData = Awaited<
	ReturnType<typeof import('@/db/queries/group-scheduling').getSchedulingWorkspace>
>

type Filters = {
	stakeId?: string
	status?: string
	coordinationStatus?: string
	assignment?: string
}

function toLocalDateTimeInput(date: Date) {
	const local = new Date(date)
	const year = local.getFullYear()
	const month = String(local.getMonth() + 1).padStart(2, '0')
	const day = String(local.getDate()).padStart(2, '0')
	const hours = String(local.getHours()).padStart(2, '0')
	const minutes = String(local.getMinutes()).padStart(2, '0')
	return `${year}-${month}-${day}T${hours}:${minutes}`
}

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

const scheduleStatusLabels: Record<ScheduleStatus, string> = {
	tentative: 'Tentative',
	pending_confirmation: 'Pending Confirmation',
	confirmed: 'Confirmed',
	completed: 'Completed',
	canceled: 'Canceled',
}

const coordinationStatusLabels: Record<CoordinationStatus, string> = {
	needs_contact: 'Needs Contact',
	contacted: 'Contacted',
	awaiting_response: 'Awaiting Response',
	proposed_times_sent: 'Proposed Times Sent',
	confirmed: 'Confirmed',
	reschedule_requested: 'Reschedule Requested',
	canceled: 'Canceled',
}

const contactRoleTemplates = [
	'Stake Assistant Director',
	'Stake Temple and Family History Leader',
	'Ward Temple and Family History Leader',
	'Bishopric Counselor',
	'Relief Society Contact',
	'Elders Quorum Contact',
	'Youth Contact',
	'Primary Contact',
]

function rankContact(contact: WorkspaceData['contacts'][number]) {
	let score = 0
	if (contact.isPrimary) score += 100
	if (contact.phone) score += 25
	if (contact.email) score += 15
	if (contact.preferredContactMethod === 'phone') score += 8
	if (contact.preferredContactMethod === 'text') score += 6
	if (contact.lastVerifiedAt) {
		const daysAgo =
			(Date.now() - new Date(contact.lastVerifiedAt).getTime()) /
			(1000 * 60 * 60 * 24)
		score += Math.max(0, 40 - Math.floor(daysAgo / 7))
	}
	return score
}

export function GroupSchedulerWorkspace({
	workspace,
	locale,
	filters,
	currentUserId,
}: {
	workspace: WorkspaceData
	locale: string
	filters: Filters
	currentUserId: string
}) {
	const notesByEvent = workspace.notes.reduce<
		Record<
			string,
			{
				id: string
				note: string
				visibility: string
				createdAt: Date
			}[]
		>
	>((acc, note) => {
		if (!acc[note.eventId]) acc[note.eventId] = []
		acc[note.eventId].push({
			id: note.id,
			note: note.note,
			visibility: note.visibility,
			createdAt: note.createdAt,
		})
		return acc
	}, {})

	const sortedStakeIds = workspace.stakes.map((stake) => stake.id)

	const filteredEvents = workspace.events.filter((event) => {
		if (filters.stakeId && event.stakeId !== filters.stakeId) return false
		if (filters.status && event.status !== filters.status) return false
		if (
			filters.coordinationStatus &&
			event.coordinationStatus !== filters.coordinationStatus
		)
			return false
		if (filters.assignment === 'mine') {
			if (
				event.primaryAssistantUserId !== currentUserId &&
				event.secondaryAssistantUserId !== currentUserId
			)
				return false
		}
		if (filters.assignment === 'unassigned') {
			if (event.primaryAssistantUserId || event.secondaryAssistantUserId) return false
		}
		if (filters.assignment?.startsWith('user:')) {
			const userId = filters.assignment.replace('user:', '')
			if (
				event.primaryAssistantUserId !== userId &&
				event.secondaryAssistantUserId !== userId
			)
				return false
		}
		return true
	})

	const filteredContacts = workspace.contacts.filter((contact) => {
		if (!filters.stakeId) return true
		return contact.stakeId === filters.stakeId
	})

	const stakeContactsMap = workspace.contacts.reduce<
		Record<string, WorkspaceData['contacts']>
	>((acc, contact) => {
		if (!contact.stakeId) return acc
		if (!acc[contact.stakeId]) acc[contact.stakeId] = []
		acc[contact.stakeId].push(contact)
		return acc
	}, {})

	const wardContactsMap = workspace.contacts.reduce<
		Record<string, WorkspaceData['contacts']>
	>((acc, contact) => {
		if (!contact.wardId) return acc
		if (!acc[contact.wardId]) acc[contact.wardId] = []
		acc[contact.wardId].push(contact)
		return acc
	}, {})

	const now = Date.now()
	const staleDays = 180
	const criticalRoleKeywords = ['assistant director', 'temple and family history']

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
					<CardTitle>Scheduler Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="grid gap-4 md:grid-cols-5">
						<div className="space-y-2">
							<Label>Stake</Label>
							<select
								name="stakeId"
								defaultValue={filters.stakeId ?? ''}
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
						<div className="space-y-2">
							<Label>Schedule status</Label>
							<select
								name="status"
								defaultValue={filters.status ?? ''}
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">All</option>
								{scheduleStatuses.map((status) => (
									<option key={status} value={status}>
										{scheduleStatusLabels[status]}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label>Outreach status</Label>
							<select
								name="coordinationStatus"
								defaultValue={filters.coordinationStatus ?? ''}
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">All</option>
								{coordinationStatuses.map((status) => (
									<option key={status} value={status}>
										{coordinationStatusLabels[status]}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label>Assignment</Label>
							<select
								name="assignment"
								defaultValue={filters.assignment ?? ''}
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">All</option>
								<option value="mine">My events</option>
								<option value="unassigned">Unassigned</option>
								{workspace.assistants.map((assistant) => (
									<option key={assistant.id} value={`user:${assistant.id}`}>
										{assistant.name ?? assistant.email}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-end gap-2">
							<Button type="submit">Apply</Button>
							<a href={`/${locale}/admin/groups/scheduler`}>
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
					<CardTitle>Stake Color Legend</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					{workspace.stakes.map((stake) => (
						<Badge
							key={stake.id}
							variant="outline"
							className={stakeColor(stake.id, sortedStakeIds)}
						>
							{stake.name}
						</Badge>
					))}
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
					<CardTitle>New Group Visit Event</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createGroupScheduleEvent} className="grid gap-4 lg:grid-cols-4">
						<input type="hidden" name="locale" value={locale} />
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="new-title">Title</Label>
							<Input
								id="new-title"
								name="title"
								required
								placeholder="Ward youth night, Stake consultant block, etc."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-stakeId">Stake</Label>
							<select
								id="new-stakeId"
								name="stakeId"
								required
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">Select stake</option>
								{workspace.stakes.map((stake) => (
									<option key={stake.id} value={stake.id}>
										{stake.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-wardIds">Wards (up to 3)</Label>
							<select
								id="new-wardIds"
								name="wardIds"
								multiple
								size={5}
								className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
							>
								{workspace.wards.map((ward) => (
									<option key={ward.id} value={ward.id}>
										{ward.stakeName}: {ward.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-primaryAssistantUserId">Primary assistant</Label>
							<select
								id="new-primaryAssistantUserId"
								name="primaryAssistantUserId"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">Unassigned</option>
								{workspace.assistants.map((assistant) => (
									<option key={assistant.id} value={assistant.id}>
										{assistant.name ?? assistant.email}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-secondaryAssistantUserId">
								Secondary assistant
							</Label>
							<select
								id="new-secondaryAssistantUserId"
								name="secondaryAssistantUserId"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								<option value="">None</option>
								{workspace.assistants.map((assistant) => (
									<option key={assistant.id} value={assistant.id}>
										{assistant.name ?? assistant.email}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-startsAt">Starts</Label>
							<Input id="new-startsAt" name="startsAt" type="datetime-local" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-endsAt">Ends (optional for tentative)</Label>
							<Input id="new-endsAt" name="endsAt" type="datetime-local" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-status">Schedule status</Label>
							<select
								id="new-status"
								name="status"
								defaultValue="tentative"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								{scheduleStatuses.map((status) => (
									<option key={status} value={status}>
										{scheduleStatusLabels[status]}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-coordinationStatus">Outreach status</Label>
							<select
								id="new-coordinationStatus"
								name="coordinationStatus"
								defaultValue="needs_contact"
								className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
							>
								{coordinationStatuses.map((status) => (
									<option key={status} value={status}>
										{coordinationStatusLabels[status]}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="new-planningNotes">Planning notes</Label>
							<Textarea id="new-planningNotes" name="planningNotes" rows={2} />
						</div>
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="new-internalNotes">Internal notes</Label>
							<Textarea id="new-internalNotes" name="internalNotes" rows={2} />
						</div>
						<div className="lg:col-span-4">
							<Button type="submit">Add Event</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Weekly Rotation Board</CardTitle>
				</CardHeader>
				<CardContent>
					<WeeklyRotationBoard
						events={filteredEvents.map((event) => ({
							id: event.id,
							title: event.title,
							stakeId: event.stakeId,
							startsAtIso: event.startsAt.toISOString(),
						}))}
						locale={locale}
						sortedStakeIds={sortedStakeIds}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Active Scheduling Board</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{filteredEvents.length === 0 ? (
						<p className="text-sm text-muted-foreground">No matching events.</p>
					) : null}

					{filteredEvents.map((event) => {
						const eventNotes = notesByEvent[event.id] ?? []
						const stakeContacts = stakeContactsMap[event.stakeId] ?? []
						const wardContacts = (event.wardIds ?? [])
							.flatMap((wardId) => wardContactsMap[wardId] ?? [])
							.filter(
								(contact, index, all) =>
									all.findIndex((item) => item.id === contact.id) === index
							)
						const eventContacts = [...wardContacts, ...stakeContacts]
							.sort((a, b) => rankContact(b) - rankContact(a))
							.slice(0, 8)
						const recommendedContacts = eventContacts.slice(0, 3)
						return (
							<details
								key={event.id}
								className={`rounded-lg border p-4 ${stakeColor(event.stakeId, sortedStakeIds)}`}
							>
								<summary className="cursor-pointer list-none">
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="text-lg font-semibold">{event.title}</h3>
										<Badge variant="outline">
											{scheduleStatusLabels[event.status as ScheduleStatus]}
										</Badge>
										<Badge variant="secondary">
											{
												coordinationStatusLabels[
													event.coordinationStatus as CoordinationStatus
												]
											}
										</Badge>
										<span className="text-sm text-muted-foreground">
											{format(event.startsAt, 'MMM d, yyyy h:mm a')} -{' '}
											{event.endsAt ? format(event.endsAt, 'h:mm a') : 'TBD'}
										</span>
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										{event.stakeName}
										{event.wardNames?.length
											? ` • ${event.wardNames.join(', ')}`
											: ''}
										{event.primaryAssistantName
											? ` • Primary: ${event.primaryAssistantName}`
											: ''}
										{event.secondaryAssistantName
											? ` • Secondary: ${event.secondaryAssistantName}`
											: ''}
									</div>
								</summary>

								<div className="mt-4 grid gap-4 lg:grid-cols-2">
									<form action={updateGroupScheduleEvent} className="space-y-3">
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="id" value={event.id} />
										<div className="grid gap-3 md:grid-cols-2">
											<div className="space-y-2 md:col-span-2">
												<Label>Title</Label>
												<Input name="title" defaultValue={event.title} required />
											</div>
											<div className="space-y-2">
												<Label>Stake</Label>
												<select
													name="stakeId"
													defaultValue={event.stakeId}
													className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
												>
													{workspace.stakes.map((stake) => (
														<option key={stake.id} value={stake.id}>
															{stake.name}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<Label>Wards (up to 3)</Label>
												<select
													name="wardIds"
													multiple
													size={5}
													defaultValue={event.wardIds ?? []}
													className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
												>
													{workspace.wards.map((ward) => (
														<option key={ward.id} value={ward.id}>
															{ward.stakeName}: {ward.name}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<Label>Primary assistant</Label>
												<select
													name="primaryAssistantUserId"
													defaultValue={event.primaryAssistantUserId ?? ''}
													className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
												>
													<option value="">Unassigned</option>
													{workspace.assistants.map((assistant) => (
														<option key={assistant.id} value={assistant.id}>
															{assistant.name ?? assistant.email}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<Label>Secondary assistant</Label>
												<select
													name="secondaryAssistantUserId"
													defaultValue={event.secondaryAssistantUserId ?? ''}
													className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
												>
													<option value="">None</option>
													{workspace.assistants.map((assistant) => (
														<option key={assistant.id} value={assistant.id}>
															{assistant.name ?? assistant.email}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<Label>Starts</Label>
												<Input
													name="startsAt"
													type="datetime-local"
													defaultValue={toLocalDateTimeInput(event.startsAt)}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label>Ends (optional for tentative)</Label>
												<Input
													name="endsAt"
													type="datetime-local"
													defaultValue={
														event.endsAt ? toLocalDateTimeInput(event.endsAt) : ''
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Schedule status</Label>
												<select
													name="status"
													defaultValue={event.status}
													className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
												>
													{scheduleStatuses.map((status) => (
														<option key={status} value={status}>
															{scheduleStatusLabels[status]}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<Label>Outreach status</Label>
												<select
													name="coordinationStatus"
													defaultValue={event.coordinationStatus}
													className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
												>
													{coordinationStatuses.map((status) => (
														<option key={status} value={status}>
															{coordinationStatusLabels[status]}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2 md:col-span-2">
												<Label>Planning notes</Label>
												<Textarea name="planningNotes" defaultValue={event.planningNotes ?? ''} rows={2} />
											</div>
											<div className="space-y-2 md:col-span-2">
												<Label>Internal notes</Label>
												<Textarea name="internalNotes" defaultValue={event.internalNotes ?? ''} rows={2} />
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button type="submit" size="sm">
												Save Changes
											</Button>
											<Button
												type="submit"
												formAction={shiftGroupScheduleEventByWeek}
												name="direction"
												value="back"
												variant="outline"
												size="sm"
											>
												Move Back 1 Week
											</Button>
											<Button
												type="submit"
												formAction={shiftGroupScheduleEventByWeek}
												name="direction"
												value="forward"
												variant="outline"
												size="sm"
											>
												Move Forward 1 Week
											</Button>
											<Button
												type="submit"
												formAction={duplicateGroupScheduleEventNextWeek}
												variant="outline"
												size="sm"
											>
												Duplicate to Next Week
											</Button>
										</div>
									</form>

									<div className="space-y-4">
										<div>
											<h4 className="text-sm font-semibold">
												Quick Outreach Steps
											</h4>
											<div className="mt-2 flex flex-wrap gap-2">
												<form action={setGroupScheduleEventCoordinationStatus}>
													<input type="hidden" name="locale" value={locale} />
													<input type="hidden" name="id" value={event.id} />
													<input
														type="hidden"
														name="coordinationStatus"
														value="contacted"
													/>
													<Button type="submit" size="sm" variant="outline">
														Mark Contacted
													</Button>
												</form>
												<form action={setGroupScheduleEventCoordinationStatus}>
													<input type="hidden" name="locale" value={locale} />
													<input type="hidden" name="id" value={event.id} />
													<input
														type="hidden"
														name="coordinationStatus"
														value="awaiting_response"
													/>
													<Button type="submit" size="sm" variant="outline">
														Awaiting Response
													</Button>
												</form>
												<form action={setGroupScheduleEventCoordinationStatus}>
													<input type="hidden" name="locale" value={locale} />
													<input type="hidden" name="id" value={event.id} />
													<input
														type="hidden"
														name="coordinationStatus"
														value="confirmed"
													/>
													<Button type="submit" size="sm">
														Mark Confirmed
													</Button>
												</form>
												<form action={setGroupScheduleEventCoordinationStatus}>
													<input type="hidden" name="locale" value={locale} />
													<input type="hidden" name="id" value={event.id} />
													<input
														type="hidden"
														name="coordinationStatus"
														value="reschedule_requested"
													/>
													<Button type="submit" size="sm" variant="destructive">
														Reschedule Requested
													</Button>
												</form>
											</div>
										</div>
										<div>
											<h4 className="text-sm font-semibold">
												Contacts For This Event
											</h4>
											<div className="mt-2 space-y-2">
												{recommendedContacts.length > 0 ? (
													<div className="rounded-md border bg-(--green-logo-soft) p-2">
														<p className="text-xs font-semibold text-muted-foreground">
															Recommended First Contacts
														</p>
														<div className="mt-1 flex flex-wrap gap-2">
															{recommendedContacts.map((contact) => (
																<Badge key={`rec-${contact.id}`} variant="secondary">
																	{contact.name}
																</Badge>
															))}
														</div>
													</div>
												) : null}
											</div>
											<div className="mt-2 space-y-2">
												{eventContacts.length === 0 ? (
													<p className="text-sm text-muted-foreground">
														No linked contacts yet for this ward/stake.
													</p>
												) : null}
												{eventContacts.map((contact) => {
													const stale = !contact.lastVerifiedAt
														? true
														: now - new Date(contact.lastVerifiedAt).getTime() >
														  staleDays * 24 * 60 * 60 * 1000
													return (
														<div
															key={contact.id}
															className="rounded-md border bg-card p-2 text-sm"
														>
															<div className="font-medium">{contact.name}</div>
															<div className="text-xs text-muted-foreground">
																{contact.role}
																{contact.wardName ? ` • ${contact.wardName}` : ''}
																{contact.stakeName ? ` • ${contact.stakeName}` : ''}
															</div>
															<div className="mt-1 flex flex-wrap gap-2">
																{contact.phone ? (
																	<a href={`tel:${contact.phone.replace(/\\D/g, '')}`}>
																		<Button size="sm" variant="outline">
																			Call
																		</Button>
																	</a>
																) : null}
																{contact.email ? (
																	<a href={`mailto:${contact.email}`}>
																		<Button size="sm" variant="outline">
																			Email
																		</Button>
																	</a>
																) : null}
																<Badge variant={stale ? 'destructive' : 'secondary'}>
																	{stale ? 'Needs verification' : 'Verified'}
																</Badge>
															</div>
														</div>
													)
												})}
											</div>
										</div>
										<div>
											<h4 className="text-sm font-semibold">Event Notes</h4>
											<div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
												{eventNotes.length === 0 ? (
													<p className="text-sm text-muted-foreground">No notes yet.</p>
												) : null}
												{eventNotes.map((note) => (
													<div key={note.id} className="rounded-md border bg-card p-2 text-sm">
														<div className="flex items-center gap-2 text-xs text-muted-foreground">
															<span>{note.visibility === 'private' ? 'Private' : 'Coordination'}</span>
															<span>•</span>
															<span>{format(note.createdAt, 'MMM d, h:mm a')}</span>
														</div>
														<p className="mt-1 whitespace-pre-wrap">{note.note}</p>
													</div>
												))}
											</div>
										</div>
										<form action={createGroupScheduleNote} className="space-y-2">
											<input type="hidden" name="locale" value={locale} />
											<input type="hidden" name="eventId" value={event.id} />
											<Label>Add note</Label>
											<Textarea name="note" rows={3} required />
											<select
												name="visibility"
												defaultValue="coordination"
												className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
											>
												<option value="coordination">Coordination note</option>
												<option value="private">Private note</option>
											</select>
											<Button type="submit" size="sm">
												Add Note
											</Button>
										</form>
										<div className="flex flex-wrap gap-2">
											<form action={clearPrivateEventNotes}>
												<input type="hidden" name="locale" value={locale} />
												<input type="hidden" name="eventId" value={event.id} />
												<Button type="submit" variant="outline" size="sm">
													Clear Private Notes
												</Button>
											</form>
											<form action={deleteGroupScheduleEvent}>
												<input type="hidden" name="locale" value={locale} />
												<input type="hidden" name="id" value={event.id} />
												<Button type="submit" variant="destructive" size="sm">
													Delete Event
												</Button>
											</form>
										</div>
									</div>
								</div>
							</details>
						)
					})}
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
								placeholder="Stake Assistant Director"
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
