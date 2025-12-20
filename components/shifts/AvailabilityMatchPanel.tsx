// // components/shifts/AvailabilityMatchPanel.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { getAvailabilityMatches } from '@/app/actions/substitute/get-availability-matches'
// import type { AvailabilityMatch } from '@/app/actions/substitute/get-availability-matches'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'

// type Props = {
// 	requestId: string
// 	requestStatus:
// 		| 'open'
// 		| 'awaiting_request_confirmation'
// 		| 'accepted'
// 		| 'cancelled'
// 		| 'expired'
// }

// function levelLabel(m: AvailabilityMatch): string {
// 	if (!m.level) return 'No availability set'
// 	if (m.specificity === 'exact')
// 		return m.level === 'usually' ? 'Usually (exact)' : 'Maybe (exact)'
// 	return m.level === 'usually' ? 'Usually (shift)' : 'Maybe (shift)'
// }

// export function AvailabilityMatchPanel({ requestId, requestStatus }: Props) {
// 	const [matches, setMatches] = useState<AvailabilityMatch[]>([])
// 	const [loading, setLoading] = useState(true)
// 	const [onlyUsually, setOnlyUsually] = useState(false)

// 	useEffect(() => {
// 		const load = async () => {
// 			const data = await getAvailabilityMatches(requestId)
// 			setMatches(data)
// 			setLoading(false)
// 		}
// 		load()
// 	}, [requestId])

// 	const filtered = matches.filter((m) =>
// 		onlyUsually ? m.level === 'usually' : true
// 	)

// 	const top = filtered.slice(0, 15)

// 	if (
// 		requestStatus === 'accepted' ||
// 		requestStatus === 'cancelled' ||
// 		requestStatus === 'expired'
// 	) {
// 		return null
// 	}

// 	function normalizePhone(phone: string): string {
// 		return phone.replace(/[^\d+]/g, '')
// 	}

// 	return (
// 		<Card>
// 			<CardHeader>
// 				<CardTitle className="text-base">Best matches</CardTitle>
// 			</CardHeader>

// 			<CardContent className="space-y-3">
// 				<label className="flex items-center gap-2 text-sm">
// 					<input
// 						type="checkbox"
// 						checked={onlyUsually}
// 						onChange={(e) => setOnlyUsually(e.target.checked)}
// 					/>
// 					Only show “Usually”
// 				</label>

// 				{loading && (
// 					<div className="text-sm text-muted-foreground">Loading matches…</div>
// 				)}

// 				{!loading && top.length === 0 && (
// 					<div className="text-sm text-muted-foreground">
// 						No consultants found.
// 					</div>
// 				)}

// 				{top.map((m) => (
// 					<div key={m.userId} className="border rounded p-3 space-y-2">
// 						<div className="flex items-start justify-between gap-3">
// 							<div className="min-w-0">
// 								<div className="font-medium truncate">{m.fullName}</div>
// 								<div className="text-sm text-muted-foreground">
// 									{levelLabel(m)}
// 								</div>
// 							</div>

// 							<Badge variant={m.score >= 80 ? 'default' : 'secondary'}>
// 								{m.score}
// 							</Badge>
// 						</div>

// 						<div className="flex flex-wrap gap-2">
// 							{m.email ? (
// 								<Button asChild size="sm" variant="outline">
// 									<a href={`mailto:${m.email}`}>Email</a>
// 								</Button>
// 							) : (
// 								<Button size="sm" variant="outline" disabled>
// 									No email
// 								</Button>
// 							)}

// 							{m.phone ? (
// 								<Button asChild size="sm" variant="outline">
// 									<a href={`tel:${normalizePhone(m.phone)}`}>Text / Call</a>
// 								</Button>
// 							) : (
// 								<Button size="sm" variant="outline" disabled>
// 									No phone
// 								</Button>
// 							)}
// 						</div>
// 					</div>
// 				))}
// 			</CardContent>
// 		</Card>
// 	)
// }
