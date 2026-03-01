'use client'

import { Label } from '@/components/ui/label'
import { KioskButton } from './KioskButton'

type Faith = { id: string; name: string }
type Stake = { id: string; name: string }
type WardGroup = {
	stakeId: string
	stakeName: string
	wards: { id: string; name: string }[]
}

type Props = {
	reasonLabel: string
	partOfFaithGroup: boolean | null
	setPartOfFaithGroup: (value: boolean) => void
	faiths: Faith[]
	faithId: string
	setFaithId: (value: string) => void
	stakes: Stake[]
	stakeId: string
	setStakeId: (value: string) => void
	wardGroups: WardGroup[]
	wardId: string
	setWardId: (value: string) => void
	attendeeCount: number
	setAttendeeCount: (value: number) => void
	isLds: boolean
	onContinue: () => void
}

export function VisitGroupDetailsStep({
	reasonLabel,
	partOfFaithGroup,
	setPartOfFaithGroup,
	faiths,
	faithId,
	setFaithId,
	stakes,
	stakeId,
	setStakeId,
	wardGroups,
	wardId,
	setWardId,
	attendeeCount,
	setAttendeeCount,
	isLds,
	onContinue,
}: Props) {
	const canContinue =
		partOfFaithGroup !== null &&
		attendeeCount >= 0 &&
		(partOfFaithGroup === false || !!faithId) &&
		(!isLds || !!stakeId)

	const availableWards =
		wardGroups.find((group) => group.stakeId === stakeId)?.wards ?? []

	return (
		<div className="space-y-4">
			<p className="text-xl font-semibold">{reasonLabel}</p>

			<div>
				<Label className="text-base">Are you part of a faith group?</Label>
				<div className="mt-2 grid grid-cols-2 gap-3">
					<KioskButton
						variant={partOfFaithGroup ? 'default' : 'outline'}
						onClick={() => setPartOfFaithGroup(true)}
					>
						Yes
					</KioskButton>
					<KioskButton
						variant={partOfFaithGroup === false ? 'default' : 'outline'}
						onClick={() => setPartOfFaithGroup(false)}
					>
						No
					</KioskButton>
				</div>
			</div>

			{partOfFaithGroup && (
				<div className="space-y-4">
					<div>
						<Label className="text-base">Faith group</Label>
						<select
							className="mt-2 w-full rounded-md border p-3 text-lg bg-background"
							value={faithId}
							onChange={(e) => setFaithId(e.target.value)}
						>
							<option value="">Select faith group</option>
							{faiths.map((faith) => (
								<option key={faith.id} value={faith.id}>
									{faith.name}
								</option>
							))}
						</select>
					</div>

					{isLds && (
						<>
							<div>
								<Label className="text-base">Stake</Label>
								<select
									className="mt-2 w-full rounded-md border p-3 text-lg bg-background"
									value={stakeId}
									onChange={(e) => setStakeId(e.target.value)}
								>
									<option value="">Select stake</option>
									{stakes.map((stake) => (
										<option key={stake.id} value={stake.id}>
											{stake.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<Label className="text-base">Ward (optional)</Label>
								<select
									className="mt-2 w-full rounded-md border p-3 text-lg bg-background"
									value={wardId}
									onChange={(e) => setWardId(e.target.value)}
									disabled={!stakeId}
								>
									<option value="">Select ward</option>
									{availableWards.map((ward) => (
										<option key={ward.id} value={ward.id}>
											{ward.name}
										</option>
									))}
								</select>
							</div>
						</>
					)}
				</div>
			)}

			<div>
				<Label className="text-base">How many people came with you?</Label>
				<input
					type="number"
					min={0}
					step={1}
					className="mt-2 w-full rounded-md border bg-background p-3 text-lg"
					value={attendeeCount}
					onChange={(e) => {
						const parsed = Number(e.target.value)
						setAttendeeCount(Number.isFinite(parsed) ? parsed : 0)
					}}
				/>
			</div>

			<KioskButton onClick={onContinue} disabled={!canContinue}>
				Continue
			</KioskButton>
		</div>
	)
}
