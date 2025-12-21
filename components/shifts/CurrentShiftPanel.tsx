// components/shifts/CurrentShiftPanel.tsx
'use client'

import { ConsultantCard } from '@/components/kiosk/ConsultantCard'
import { useCurrentPresence } from '@/hooks/use-current-presence'

type Props = {
	title?: string
	pollMs?: number
	showPatrons?: boolean
}

export function CurrentShiftPanel({
	title = 'Currently in the Center',
	pollMs,
	showPatrons = true,
}: Props) {
	const { data, loading } = useCurrentPresence(pollMs)

	if (loading) {
		return <p className="text-sm text-muted-foreground">Loading shift...</p>
	}

	if (!data) return null

	return (
		<section className="space-y-3">
			<h2 className="text-xl font-semibold">{title}</h2>

			{/* CONSULTANTS */}
			{data.consultants.length > 0 ? (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{data.consultants.map((c) => {
						const certs = c.userId
							? (data.certificatesByUser[c.userId] ?? []).filter(
									(cert) => cert.status === 'current'
							  )
							: []

						return (
							<ConsultantCard
								key={c.personId}
								name={c.fullName}
								imageUrl={c.profileImageUrl}
								certificates={certs}
							/>
						)
					})}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					No consultants currently on shift.
				</p>
			)}

			{/* PATRONS (optional) */}
			{showPatrons && data.patrons.length > 0 && (
				<div className="pt-2 border-t space-y-2">
					<p className="text-sm font-medium">Patrons currently visiting</p>

					<ul className="space-y-1 text-sm text-muted-foreground">
						{data.patrons.map((p) => (
							<li key={p.personId} className="flex justify-between">
								<span>{p.fullName}</span>
								{p.purposeName && (
									<span className="text-xs">{p.purposeName}</span>
								)}
							</li>
						))}
					</ul>
				</div>
			)}
		</section>
	)
}
