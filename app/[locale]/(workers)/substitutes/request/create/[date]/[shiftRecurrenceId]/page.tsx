import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSubRequest } from '@/app/actions/substitute/create-request'
import {
	findExistingSubRequest,
	getShiftForRequestCreation,
} from '@/db/queries/shifts'

interface PageProps {
	params: Promise<{
		locale: string
		date: string
		shiftRecurrenceId: string
	}>
}

export default async function CreateSubRequestPage({ params }: PageProps) {
	const { locale, date, shiftRecurrenceId } = await params // ✅ REQUIRED

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	// 1️⃣ Validate shift + ownership
	const shift = await getShiftForRequestCreation({
		shiftRecurrenceId,
		date,
		userId: session.user.id,
	})

	if (!shift) {
		redirect(`/${locale}/dashboard`)
	}

	// 2️⃣ Reuse existing request if present
	const existing = await findExistingSubRequest({
		shiftRecurrenceId,
		date,
		requestedByUserId: session.user.id,
	})

	if (existing) {
		redirect(`/${locale}/substitutes/request/${existing.id}`)
	}

	// 3️⃣ Create immediately
	await createSubRequest({
		shiftId: shift.shiftId,
		shiftRecurrenceId,
		date,
		startTime: shift.startTime,
		endTime: shift.endTime,
		type: 'substitute',
	})

	// 4️⃣ Fetch newly created request
	const created = await findExistingSubRequest({
		shiftRecurrenceId,
		date,
		requestedByUserId: session.user.id,
	})

	if (!created) {
		redirect(`/${locale}/dashboard`)
	}

	// 5️⃣ Redirect to real request page
	redirect(`/${locale}/substitutes/request/${created.id}`)
}
