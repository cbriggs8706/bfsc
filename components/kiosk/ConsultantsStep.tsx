// components/kiosk/ConsultantsStep.tsx
'use client'

import { ConsultantCard } from '@/components/kiosk/ConsultantCard'
import { OnShiftConsultant } from '@/types/kiosk'
import { KioskButton } from './KioskButton'
import { AnnouncementBanner } from '../custom/AnnouncementBanner'
import { Announcement } from '@/db'

type Props = {
	announcements: Announcement[]
	consultants: OnShiftConsultant[]
	onDone: () => void
}

export function ConsultantsStep({ announcements, consultants, onDone }: Props) {
	return (
		<div className="space-y-4">
			<p className="text-xl text-center font-semibold">You’re signed in!</p>

			{consultants.length > 0 ? (
				<>
					<p className="text-center text-muted-foreground">
						Consultants currently on shift
					</p>

					<div className="grid grid-cols-2 gap-3">
						{consultants.map((c) => (
							<ConsultantCard
								key={c.personId}
								name={c.fullName}
								imageUrl={c.profileImageUrl}
							/>
						))}
					</div>
				</>
			) : (
				<p className="text-center text-muted-foreground">
					No consultants are currently on shift.
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
