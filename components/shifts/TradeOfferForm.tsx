// // components/shifts/TradeOfferForm.tsx
// import { useEffect, useState } from 'react'
// import { addMonths } from 'date-fns'
// import { createTradeOffer } from '@/app/actions/substitute/create-trade-offer'
// import { Button } from '@/components/ui/button'
// import type { ShiftInstance } from '@/types/shifts'
// import { generateShiftInstances } from '@/lib/shifts/generate-shift-instances'
// import { TradeOptionDraft } from '@/types/substitutes'

// type TradeOfferFormProps = {
// 	requestId: string
// 	currentUserId: string
// }

// export function TradeOfferForm({
// 	requestId,
// 	currentUserId,
// }: TradeOfferFormProps) {
// 	const [instances, setInstances] = useState<ShiftInstance[]>([])
// 	const [selected, setSelected] = useState<TradeOptionDraft[]>([])
// 	const [busy, setBusy] = useState(false)

// 	useEffect(() => {
// 		const load = async () => {
// 			const all = await generateShiftInstances({
// 				start: new Date(),
// 				end: addMonths(new Date(), 3),
// 			})

// 			const mine = all.filter((i) => i.assignedUserIds.includes(currentUserId))

// 			setInstances(mine)
// 		}

// 		load()
// 	}, [currentUserId])

// 	function toggle(option: TradeOptionDraft) {
// 		setSelected((prev) => {
// 			const exists = prev.some(
// 				(o) => o.shiftId === option.shiftId && o.date === option.date
// 			)

// 			if (exists) {
// 				return prev.filter(
// 					(o) => !(o.shiftId === option.shiftId && o.date === option.date)
// 				)
// 			}

// 			return [...prev, option]
// 		})
// 	}

// 	async function submit() {
// 		if (selected.length === 0) return

// 		setBusy(true)
// 		await createTradeOffer(requestId, undefined, selected)
// 		location.reload()
// 	}

// 	return (
// 		<div className="space-y-3 border rounded p-4">
// 			<h3 className="font-semibold">Offer a trade</h3>

// 			<div className="space-y-2 max-h-64 overflow-auto">
// 				{instances.map((i) => {
// 					const checked = selected.some(
// 						(o) => o.shiftId === i.shiftId && o.date === i.date
// 					)

// 					return (
// 						<label
// 							key={`${i.shiftId}-${i.date}`}
// 							className="flex items-center gap-2 text-sm"
// 						>
// 							<input
// 								type="checkbox"
// 								checked={checked}
// 								onChange={() =>
// 									toggle({
// 										shiftId: i.shiftId,
// 										shiftRecurrenceId: i.shiftRecurrenceId,
// 										date: i.date,
// 										startTime: i.startTime,
// 										endTime: i.endTime,
// 									})
// 								}
// 							/>
// 							<span>
// 								{i.date} · {i.startTime}–{i.endTime}
// 							</span>
// 						</label>
// 					)
// 				})}
// 			</div>

// 			<Button disabled={busy || selected.length === 0} onClick={submit}>
// 				Submit trade offer
// 			</Button>
// 		</div>
// 	)
// }
