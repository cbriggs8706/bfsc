// components/shifts/TradeOffersList.tsx

import { selectTradeOption } from '@/app/actions/substitute/select-trade-option'
import { Button } from '@/components/ui/button'
import { TradeOffer } from '@/types/substitutes'
import { useState } from 'react'

type TradeOffersListProps = {
	requestId: string
	offers: TradeOffer[]
}

export function TradeOffersList({ requestId, offers }: TradeOffersListProps) {
	const [busy, setBusy] = useState(false)

	async function accept(offerId: string, optionId: string) {
		setBusy(true)
		await selectTradeOption(requestId, offerId, optionId)
		location.reload()
	}

	if (offers.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">No trade offers yet.</div>
		)
	}

	return (
		<div className="space-y-4">
			{offers.map((offer) => (
				<div key={offer.id} className="border rounded p-4 space-y-2">
					<div className="font-medium">
						Trade offer from {offer.offeredByName}
					</div>

					<ul className="space-y-2">
						{offer.options.map((opt) => (
							<li
								key={opt.id}
								className="flex items-center justify-between border rounded p-2"
							>
								<span className="text-sm">
									{opt.date} · {opt.startTime}–{opt.endTime}
								</span>
								<Button
									size="sm"
									disabled={busy}
									onClick={() => accept(offer.id, opt.id)}
								>
									Accept
								</Button>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	)
}
