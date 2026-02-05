// app/[locale]/(public)/research-specialists/page.tsx
import { db } from '@/db'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import {
	shiftAssignments,
	shiftRecurrences,
	weeklyShifts,
} from '@/db/schema/tables/shifts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { formatTimeRange } from '@/utils/time'
import { and, asc, eq } from 'drizzle-orm'
import Link from 'next/link'

interface Props {
	params: Promise<{ locale: string }>
}

export default async function ClassesPage({ params }: Props) {
	await params
	const centerTime = await getCenterTimeConfig()

	const rows = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			recurrenceId: shiftRecurrences.id,
			recurrenceLabel: shiftRecurrences.label,
			specialties: kioskPeople.researchSpecialties,
			languages: kioskPeople.languagesSpoken,
		})
		.from(weeklyShifts)
		.innerJoin(shiftRecurrences, eq(shiftRecurrences.shiftId, weeklyShifts.id))
		.leftJoin(
			shiftAssignments,
			eq(shiftAssignments.shiftRecurrenceId, shiftRecurrences.id)
		)
		.leftJoin(kioskPeople, eq(kioskPeople.userId, shiftAssignments.userId))
		.where(
			and(
				eq(weeklyShifts.isActive, true),
				eq(weeklyShifts.type, 'regular'),
				eq(shiftRecurrences.isActive, true)
			)
		)
		.orderBy(asc(weeklyShifts.weekday), asc(weeklyShifts.startTime))

	const WEEKDAY_LABELS = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	]

	const scheduleMap = new Map<
		number,
		Map<
			string,
			{
				startTime: string
				endTime: string
				recurrences: Map<string, Set<string>>
			}
		>
	>()

	for (const row of rows) {
		const dayMap = scheduleMap.get(row.weekday) ?? new Map()
		scheduleMap.set(row.weekday, dayMap)

		const recurrenceKey = `${row.weekday}:${row.startTime}-${row.endTime}`

		const shiftEntry =
			dayMap.get(recurrenceKey) ??
			{
				startTime: row.startTime,
				endTime: row.endTime,
				recurrences: new Map<string, Set<string>>(),
			}

		dayMap.set(recurrenceKey, shiftEntry)

		const label = row.recurrenceLabel ?? 'Weekly'
		if (!shiftEntry.recurrences.has(label)) {
			shiftEntry.recurrences.set(label, new Set<string>())
		}

		if (row.specialties) {
			const bucket = shiftEntry.recurrences.get(label)!
			for (const specialty of row.specialties) {
				if (specialty) bucket.add(specialty)
			}
		}

		if (row.languages) {
			const bucket = shiftEntry.recurrences.get(label)!
			for (const language of row.languages) {
				if (language) bucket.add(`Translation: ${language}`)
			}
		}
	}

	const days = WEEKDAY_LABELS.map((label, weekday) => {
		const shifts = scheduleMap.get(weekday)

		return {
			label,
			shifts: shifts
				? Array.from(shifts.values()).sort((a, b) => {
						const timeOrder = a.startTime.localeCompare(b.startTime)
						if (timeOrder !== 0) return timeOrder
						return a.endTime.localeCompare(b.endTime)
					})
				: [],
		}
	})

	const activeDays = days.filter((day) => day.shifts.length > 0)
	const ordinalRegex = /\b(\d+(?:st|nd|rd|th))\b/i

	const formatRecurrenceLabel = (
		labels: string[],
		dayLabel: string
	): string => {
		const dayPlural = `${dayLabel}s`
		const normalized = labels.map((label) => label.trim()).filter(Boolean)
		const ordinalOrder: Record<string, number> = {
			'1st': 1,
			'2nd': 2,
			'3rd': 3,
			'4th': 4,
			'5th': 5,
		}

		const hasAll = normalized.some((label) => {
			const lower = label.toLowerCase()
			return lower === 'weekly' || lower.startsWith('every ')
		})

		if (hasAll) {
			return `all ${dayPlural}`
		}

		const ordinals: string[] = []
		const others: string[] = []

		for (const label of normalized) {
			const match = label.match(ordinalRegex)
			if (match) {
				ordinals.push(match[1])
			} else {
				others.push(label)
			}
		}

		const joinWithAnd = (items: string[]) => {
			if (items.length <= 1) return items.join('')
			if (items.length === 2) return `${items[0]} and ${items[1]}`
			return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
		}

		const parts: string[] = []
		if (ordinals.length > 0) {
			const uniqueOrdinals = Array.from(new Set(ordinals))
			const sortedOrdinals = uniqueOrdinals.sort(
				(a, b) => (ordinalOrder[a.toLowerCase()] ?? 99) - (ordinalOrder[b.toLowerCase()] ?? 99)
			)

			if (sortedOrdinals.length >= 4) {
				parts.push(`all ${dayPlural}`)
			} else {
				parts.push(`${joinWithAnd(sortedOrdinals)} ${dayPlural}`)
			}
		}
		if (others.length > 0) {
			parts.push(...others)
		}

		return parts.join(', ')
	}

	return (
		<div className="p-4 space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold">Research Specialists</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Each shift has workers who can assist with basic family history
					research and the use of our digitizing equipment. Some workers also
					have specialized expertise in locations, languages, and tools.
				</p>
			</div>

			{/* Primary Contact */}
			<Card>
				<CardContent className="space-y-3">
					<p className="text-sm">
						For all appointments, contact the center to schedule yours:
					</p>

					<Link href="tel:+12088787286">
						<Button className="ml-2">(208) 878-7286</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Weekly Schedule */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Weekly Schedule</h2>
				{activeDays.length === 0 ? (
					<Card>
						<CardContent className="py-6">
							<p className="text-sm text-muted-foreground">
								No specialist schedule has been posted yet.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 lg:grid-cols-2">
						{activeDays.map((day) => (
							<Card key={day.label}>
								<CardContent className="space-y-4">
									<h3 className="font-semibold">{day.label}</h3>

									{day.shifts.map((shift) => (
										<div
											key={`${day.label}-${shift.startTime}-${shift.endTime}`}
											className="space-y-2"
										>
											<p className="text-sm text-muted-foreground">
												{formatTimeRange(
													shift.startTime,
													shift.endTime,
													centerTime.timeFormat
												)}
											</p>
											{(() => {
												const recurrenceLabels = Array.from(
													shift.recurrences.keys()
												)
												const hasMultipleRecurrences =
													recurrenceLabels.length > 1

												if (!hasMultipleRecurrences) {
													const [label] = recurrenceLabels
													const specialties = Array.from(
														shift.recurrences.get(label) ?? []
													)
													return specialties.length > 0 ? (
														<ul className="list-disc pl-5 text-sm space-y-1">
															{specialties
																.sort((a, b) => a.localeCompare(b))
																.map((specialty) => (
																	<li key={specialty}>
																		{specialty}{' '}
																		{label && label !== 'Weekly'
																			? `(${label})`
																			: ''}
																	</li>
																))}
														</ul>
													) : (
														<p className="text-sm text-muted-foreground">
															Specialties will be posted soon.
														</p>
													)
												}

												const specialtyMap = new Map<string, Set<string>>()
												for (const [label, specialties] of shift.recurrences) {
													for (const specialty of specialties) {
														if (!specialtyMap.has(specialty)) {
															specialtyMap.set(specialty, new Set())
														}
														specialtyMap.get(specialty)!.add(label)
													}
												}

												const specialtyRows = Array.from(
													specialtyMap.entries()
												).sort((a, b) => a[0].localeCompare(b[0]))

												return specialtyRows.length > 0 ? (
													<ul className="list-disc pl-5 text-sm space-y-1">
														{specialtyRows.map(([specialty, labels]) => (
															<li key={specialty}>
																{specialty}{' '}
																{labels.size > 0
																	? `(${formatRecurrenceLabel(
																			Array.from(labels),
																			day.label
																		)})`
																	: ''}
															</li>
														))}
													</ul>
												) : (
													<p className="text-sm text-muted-foreground">
														Specialties will be posted soon.
													</p>
												)
											})()}
										</div>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Special Notes */}
			<Card>
				<CardContent className="space-y-4">
					<h2 className="text-xl font-semibold">Special Notes</h2>

					<div className="space-y-2 text-sm">
						<p>
							<strong>DNA assistance:</strong> Contact the center to schedule a
							consultation.
						</p>
						<p>
							<strong>Zurich, Switzerland marriages (1580–1799):</strong>{' '}
							Contact the center for access to an indexed thumb drive of
							marriages by bride or groom.
						</p>
					</div>
				</CardContent>
			</Card>

		</div>
	)
}
