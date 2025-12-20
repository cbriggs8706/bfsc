// lib/shifts/generate-shift-instances.ts
import { db } from '@/db'
import {
	weeklyShifts,
	shiftRecurrences,
	shiftAssignments,
	shiftExceptions,
} from '@/db/schema/tables/shifts'
import { getDatesInRange, matchesRecurrence } from './dates'
import { formatISO } from 'date-fns'
import { eq, inArray } from 'drizzle-orm'
import type { ShiftInstance } from '@/types/shifts'

type GenerateShiftInstancesArgs = {
	start: Date
	end: Date
}

export async function generateShiftInstances({
	start,
	end,
}: GenerateShiftInstancesArgs): Promise<ShiftInstance[]> {
	// 1️⃣ Load base data
	const [shifts, recurrences, assignments, exceptions] = await Promise.all([
		db.select().from(weeklyShifts).where(eq(weeklyShifts.isActive, true)),
		db
			.select()
			.from(shiftRecurrences)
			.where(eq(shiftRecurrences.isActive, true)),
		db.select().from(shiftAssignments),
		db
			.select()
			.from(shiftExceptions)
			.where(
				inArray(
					shiftExceptions.date,
					getDatesInRange(start, end).map((d) =>
						formatISO(d, { representation: 'date' })
					)
				)
			),
	])

	// 2️⃣ Build lookup maps
	const assignmentsByRecurrence = new Map<string, string[]>()
	for (const a of assignments) {
		const list = assignmentsByRecurrence.get(a.shiftRecurrenceId) ?? []
		list.push(a.userId)
		assignmentsByRecurrence.set(a.shiftRecurrenceId, list)
	}

	const exceptionsByShiftDate = new Map<string, typeof exceptions>()
	for (const ex of exceptions) {
		const key = `${ex.shiftId}:${ex.date}`
		const list = exceptionsByShiftDate.get(key) ?? []
		list.push(ex)
		exceptionsByShiftDate.set(key, list)
	}

	// 3️⃣ Generate instances
	const instances: ShiftInstance[] = []
	const dates = getDatesInRange(start, end)

	for (const date of dates) {
		const dateStr = formatISO(date, { representation: 'date' })

		for (const rec of recurrences) {
			const shift = shifts.find((s) => s.id === rec.shiftId)
			if (!shift) continue

			if (!matchesRecurrence(date, shift.weekday, rec.weekOfMonth)) continue

			let assignedUserIds = assignmentsByRecurrence.get(rec.id) ?? []

			let isException = false
			let exceptionType: ShiftInstance['exceptionType']

			const exKey = `${shift.id}:${dateStr}`
			const exList = exceptionsByShiftDate.get(exKey) ?? []

			for (const ex of exList) {
				isException = true
				exceptionType = ex.overrideType as ShiftInstance['exceptionType']

				if (ex.overrideType === 'remove') {
					assignedUserIds = []
				}

				if (ex.overrideType === 'add' && ex.userId) {
					assignedUserIds = [...assignedUserIds, ex.userId]
				}

				if (ex.overrideType === 'replace' && ex.userId) {
					assignedUserIds = [ex.userId]
				}
			}

			instances.push({
				shiftId: shift.id,
				shiftRecurrenceId: rec.id,
				date: dateStr,
				startTime: shift.startTime,
				endTime: shift.endTime,
				assignedUserIds,
				isException,
				exceptionType,
				notes: shift.notes ?? undefined,
			})
		}
	}

	return instances
}
