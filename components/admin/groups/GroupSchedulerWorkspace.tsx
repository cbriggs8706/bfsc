import {
	bulkImportGroupScheduleEvents,
	clearPrivateEventNotes,
	createGroupScheduleEvent,
	createGroupScheduleNote,
	deleteGroupScheduleEvent,
	duplicateGroupScheduleEventNextWeek,
	setGroupScheduleEventCoordinationStatus,
	shiftGroupScheduleEventByWeek,
	updateGroupScheduleEvent,
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
import {
	addDays,
	endOfMonth,
	endOfWeek,
	format,
	isWithinInterval,
	startOfMonth,
	startOfWeek,
} from 'date-fns'

type WorkspaceData = Awaited<
	ReturnType<typeof import('@/db/queries/group-scheduling').getSchedulingWorkspace>
>

type Filters = {
	stakeId?: string
	status?: string
	coordinationStatus?: string
	assignment?: string
	month?: string
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

function stakeDotColor(stakeId: string, sortedStakeIds: string[]) {
	const classes = [
		'bg-(--blue-accent)',
		'bg-(--green-accent)',
		'bg-(--orange-accent)',
		'bg-(--purple-accent)',
		'bg-(--red-accent)',
		'bg-(--gray-accent)',
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

function ymd(date: Date) {
	return format(date, 'yyyy-MM-dd')
}

function monthKey(date: Date) {
	return format(date, 'yyyy-MM')
}

function parseMonth(value?: string) {
	if (!value) return startOfMonth(new Date())
	const m = value.match(/^(\d{4})-(\d{2})$/)
	if (!m) return startOfMonth(new Date())
	const year = Number(m[1])
	const month = Number(m[2])
	if (month < 1 || month > 12) return startOfMonth(new Date())
	return new Date(year, month - 1, 1)
}

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

	const activeMonthDate = parseMonth(filters.month)
	const activeMonthStart = startOfMonth(activeMonthDate)
	const activeMonthEnd = endOfMonth(activeMonthDate)
	const prevMonth = format(
		new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth() - 1, 1),
		'yyyy-MM'
	)
	const nextMonth = format(
		new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth() + 1, 1),
		'yyyy-MM'
	)

	const occurrenceRows = filteredEvents.flatMap((event) => {
		const start = new Date(event.startsAt)
		const end = event.endsAt ? new Date(event.endsAt) : start
		const rows: {
			eventId: string
			date: Date
			status: string
			title: string
			stakeId: string
			stakeName: string
		}[] = []

		let cursor = new Date(start)
		while (cursor <= end) {
			rows.push({
				eventId: event.id,
				date: new Date(cursor),
				status: event.status,
				title: event.title,
				stakeId: event.stakeId,
				stakeName: event.stakeName,
			})
			cursor = addDays(cursor, 7)
		}

		return rows
	})

	const occurrenceByDay = occurrenceRows.reduce<
		Record<
			string,
			{
				eventId: string
				status: string
				title: string
				stakeId: string
				stakeName: string
			}[]
		>
	>((acc, row) => {
		const key = ymd(row.date)
		if (!acc[key]) acc[key] = []
		acc[key].push({
			eventId: row.eventId,
			status: row.status,
			title: row.title,
			stakeId: row.stakeId,
			stakeName: row.stakeName,
		})
		return acc
	}, {})

	const activeMonthEventIds = new Set(
		occurrenceRows
			.filter((row) =>
				isWithinInterval(row.date, { start: activeMonthStart, end: activeMonthEnd })
			)
			.map((row) => row.eventId)
	)

	const activeMonthEvents = filteredEvents.filter((event) =>
		activeMonthEventIds.has(event.id)
	)
	const monthQuery = {
		stakeId: filters.stakeId ?? '',
		status: filters.status ?? '',
		coordinationStatus: filters.coordinationStatus ?? '',
		assignment: filters.assignment ?? '',
	}

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

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Scheduler Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="grid gap-4 md:grid-cols-5">
						<input
							type="hidden"
							name="month"
							value={format(activeMonthDate, 'yyyy-MM')}
						/>
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
					<CardTitle>Create / Import Events</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<details className="rounded-md border border-border bg-card p-3">
						<summary className="cursor-pointer text-sm font-medium">Add New Event</summary>
						<form action={createGroupScheduleEvent} className="mt-4 grid gap-4 lg:grid-cols-4">
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
					</details>
					<details className="rounded-md border border-border bg-card p-3">
						<summary className="cursor-pointer text-sm font-medium">
							Bulk Import CSV/TSV
						</summary>
						<div className="mt-3 space-y-3">
							<p className="text-sm text-muted-foreground">
								Expected headers: Stake, Ward, Activity Name, Start Date, End Date.
							</p>
							<form action={bulkImportGroupScheduleEvents} className="grid gap-4 md:grid-cols-4">
								<input type="hidden" name="locale" value={locale} />
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="bulk-file">CSV file</Label>
									<Input id="bulk-file" name="file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" required />
								</div>
								<div className="space-y-2">
									<Label htmlFor="bulk-status">Imported schedule status</Label>
									<select
										id="bulk-status"
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
									<Label htmlFor="bulk-coordination">Imported outreach status</Label>
									<select
										id="bulk-coordination"
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
								<div className="md:col-span-4">
									<Button type="submit">Import File</Button>
								</div>
							</form>
						</div>
					</details>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-2">
						<CardTitle>Schedule Calendar (Month)</CardTitle>
						<form className="flex items-center gap-2">
							<input type="hidden" name="stakeId" value={monthQuery.stakeId} />
							<input type="hidden" name="status" value={monthQuery.status} />
							<input
								type="hidden"
								name="coordinationStatus"
								value={monthQuery.coordinationStatus}
							/>
							<input
								type="hidden"
								name="assignment"
								value={monthQuery.assignment}
							/>
							<Button type="submit" name="month" value={prevMonth} variant="outline" size="sm">
								Prev
							</Button>
							<Button type="submit" name="month" value={nextMonth} variant="outline" size="sm">
								Next
							</Button>
						</form>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{(() => {
						const start = startOfWeek(startOfMonth(activeMonthDate), { weekStartsOn: 0 })
						const end = endOfWeek(endOfMonth(activeMonthDate), { weekStartsOn: 0 })
						const days: Date[] = []
						for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
							days.push(new Date(d))
						}
						const monthDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
						return (
							<div className="space-y-2">
								<h3 className="text-lg font-semibold">
									{format(activeMonthDate, 'MMMM yyyy')}
								</h3>
								<div className="grid grid-cols-7 gap-2">
									{monthDays.map((day) => (
										<div
											key={`${monthKey(activeMonthDate)}-${day}`}
											className="text-xs font-semibold text-muted-foreground px-2"
										>
											{day}
										</div>
									))}
									{days.map((day) => {
										const key = ymd(day)
										const items = occurrenceByDay[key] ?? []
										const tentative = items.filter((item) => item.status === 'tentative')
										const confirmed = items.filter((item) => item.status !== 'tentative')
										const inMonth = activeMonthDate.getMonth() === day.getMonth()
										return (
											<div
												key={key}
												className={`min-h-24 rounded-md border p-2 ${inMonth ? 'bg-card' : 'bg-muted/40'}`}
											>
												<div className="text-xs font-semibold mb-1">{format(day, 'd')}</div>
												<div className="flex flex-wrap gap-1 mb-1">
													{tentative.map((item) => (
														<span
															key={`${item.eventId}-dot`}
															className={`inline-block h-2.5 w-2.5 rounded-full ${stakeDotColor(item.stakeId, sortedStakeIds)}`}
															title={`Tentative: ${item.stakeName}`}
														/>
													))}
												</div>
												<div className="space-y-1">
													{confirmed.slice(0, 2).map((item) => (
														<div
															key={`${item.eventId}-txt`}
															className="text-[11px] leading-tight truncate"
														>
															{item.title}
														</div>
													))}
													{confirmed.length > 2 ? (
														<div className="text-[11px] text-muted-foreground">
															+{confirmed.length - 2} more
														</div>
													) : null}
												</div>
												{items.length > 0 ? (
													<details className="mt-2">
														<summary className="text-[11px] text-muted-foreground cursor-pointer">
															Day details
														</summary>
														<div className="mt-1 space-y-1">
															{items.map((item) =>
																item.status === 'tentative' ? (
																	<div
																		key={`${item.eventId}-detail-dot`}
																		className="flex items-center gap-2"
																	>
																		<span
																			className={`inline-block h-2.5 w-2.5 rounded-full ${stakeDotColor(item.stakeId, sortedStakeIds)}`}
																		/>
																		<span className="sr-only">
																			Tentative {item.stakeName}
																		</span>
																	</div>
																) : (
																	<div
																		key={`${item.eventId}-detail-txt`}
																		className="text-[11px] truncate"
																	>
																		{item.title}
																	</div>
																)
															)}
														</div>
													</details>
												) : null}
											</div>
										)
									})}
								</div>
							</div>
						)
					})()}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-2">
						<CardTitle>Active Scheduling Board (By Month)</CardTitle>
						<form className="flex items-center gap-2">
							<input type="hidden" name="stakeId" value={monthQuery.stakeId} />
							<input type="hidden" name="status" value={monthQuery.status} />
							<input
								type="hidden"
								name="coordinationStatus"
								value={monthQuery.coordinationStatus}
							/>
							<input
								type="hidden"
								name="assignment"
								value={monthQuery.assignment}
							/>
							<Button type="submit" name="month" value={prevMonth} variant="outline" size="sm">
								Prev
							</Button>
							<Button type="submit" name="month" value={nextMonth} variant="outline" size="sm">
								Next
							</Button>
						</form>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<h3 className="text-lg font-semibold">
							{format(activeMonthDate, 'MMMM yyyy')}
						</h3>
						{activeMonthEvents.map((event) => {
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
					</div>
					{activeMonthEvents.length === 0 ? (
						<p className="text-sm text-muted-foreground">No matching events.</p>
					) : null}
				</CardContent>
			</Card>

		</div>
	)
}
