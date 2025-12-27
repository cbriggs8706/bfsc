// components/kiosk/WorkersStep.tsx
'use client'

import { WorkerCard } from '@/components/kiosk/WorkerCard'
import { OnShiftWorker } from '@/types/kiosk'
import { KioskButton } from './KioskButton'
import { AnnouncementBanner } from '../custom/AnnouncementBanner'
import { Announcement } from '@/db'
import { CertificateSummary } from '@/types/training'

type Props = {
	announcements: Announcement[]
	workers: OnShiftWorker[]
	certificatesByUser: Record<string, CertificateSummary[]>
	onDone: () => void
}

export function WorkersStep({
	announcements,
	workers,
	certificatesByUser,
	onDone,
}: Props) {
	return (
		<div className="space-y-4">
			<p className="text-xl text-center font-semibold">You’re signed in!</p>

			{workers.length > 0 ? (
				<>
					<p className="text-center text-muted-foreground">
						Workers currently on shift
					</p>

					<div className="grid grid-cols-2 gap-3">
						{workers.map((c) => {
							const certificates = c.userId
								? (certificatesByUser[c.userId] ?? []).filter(
										(cert) => cert.status === 'current'
								  )
								: []

							return (
								<WorkerCard
									key={c.personId}
									name={c.fullName}
									imageUrl={c.profileImageUrl}
									certificates={certificates}
									languages={c.languages}
								/>
							)
						})}
					</div>
				</>
			) : (
				<p className="text-center text-muted-foreground">
					No workers are currently on shift.
				</p>
			)}

			<p className="text-center text-muted-foreground">
				No classes are scheduled for today.
			</p>

			<p className="text-center text-muted-foreground">Announcements:</p>

			{announcements.length > 0 && (
				<div className="space-y-3">
					{announcements.map((a) => (
						<AnnouncementBanner key={a.id} announcement={a} />
					))}
				</div>
			)}

			<KioskButton onClick={onDone}>Return to Sign In</KioskButton>
		</div>
	)
}
