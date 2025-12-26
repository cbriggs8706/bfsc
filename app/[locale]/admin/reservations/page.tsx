// app/[locale]/admin/reservations/page.tsx

import { ApprovedReservationsList } from '@/components/resource/ApprovedReservationsList'
import { ReservationInbox } from '@/components/resource/ReservationInbox'
import {
	getApprovedReservations,
	getPendingReservations,
} from '@/db/queries/resources/reservations'

export default async function ReservationsPage() {
	const [pending, approved] = await Promise.all([
		getPendingReservations(),
		getApprovedReservations(),
	])

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Reservations</h1>
				<p className="text-sm text-muted-foreground">
					Reservation calendar for equipment, activities, groups etc.
				</p>
			</div>
			<ReservationInbox items={pending} />
			<ApprovedReservationsList items={approved} />
		</div>
	)
}
