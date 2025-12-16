// components/kiosk/NewPersonStep.tsx
'use client'

import { Label } from '@/components/ui/label'
import { KioskInput } from './KioskInput'
import { KioskButton } from './KioskButton'

type Props = {
	name: string
	email: string
	phone: string
	faithId: string
	wardId: string
	selectedPositionIds: string[]
	faiths: { id: string; name: string }[]
	wards: {
		stakeId: string
		stakeName: string
		wards: { id: string; name: string }[]
	}[]
	positions: { id: string; name: string }[]

	setFaithId: (v: string) => void
	setWardId: (v: string) => void
	setSelectedPositionIds: (v: string[]) => void

	setEmail: (v: string) => void
	setPhone: (v: string) => void

	onSubmit: () => void
}

export function NewPersonStep({
	name,
	email,
	phone,
	faiths,
	faithId,
	wardId,
	positions,
	wards,
	selectedPositionIds,
	setEmail,
	setPhone,
	setFaithId,
	setWardId,
	setSelectedPositionIds,
	onSubmit,
}: Props) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Name</Label>
				<KioskInput value={name} disabled />
			</div>

			<div>
				<Label>Email *</Label>
				<KioskInput
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</div>

			<div>
				<Label>Phone (optional)</Label>
				<KioskInput value={phone} onChange={(e) => setPhone(e.target.value)} />
			</div>

			<div>
				<Label>Faith</Label>
				<select
					className="w-full rounded-md border p-2"
					value={faithId}
					onChange={(e) => {
						setFaithId(e.target.value)
						setWardId('')
					}}
				>
					<option value="">Select faith</option>
					{faiths.map((f) => (
						<option key={f.id} value={f.id}>
							{f.name}
						</option>
					))}
				</select>
			</div>

			{faithId && (
				<div>
					<Label>Ward</Label>
					<select
						className="w-full rounded-md border p-2"
						value={wardId}
						onChange={(e) => setWardId(e.target.value)}
					>
						<option value="">Select ward</option>

						{wards.map((group) => (
							<optgroup key={group.stakeId} label={group.stakeName}>
								{group.wards.map((w) => (
									<option key={w.id} value={w.id}>
										{w.name}
									</option>
								))}
							</optgroup>
						))}
					</select>
					<div>
						<Label>Positions (optional)</Label>
						<div className="space-y-2">
							{positions.map((p) => (
								<label key={p.id} className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={selectedPositionIds.includes(p.id)}
										onChange={(e) => {
											setSelectedPositionIds(
												e.target.checked
													? [...selectedPositionIds, p.id]
													: selectedPositionIds.filter((id) => id !== p.id)
											)
										}}
									/>
									{p.name}
								</label>
							))}
						</div>
					</div>
				</div>
			)}

			{/* PASSCODE NOTICE (NOT EDITABLE) */}
			<p className="text-sm text-muted-foreground">
				A 6-digit check-in code will be automatically generated for you.
			</p>

			<KioskButton onClick={onSubmit}>Save & Continue</KioskButton>
		</div>
	)
}
