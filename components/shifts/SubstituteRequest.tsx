// components/shifts/SubstituteRequest.tsx
'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type {
	AvailabilityMatch,
	CalendarRequest,
	RequestDetail,
	Volunteer,
} from '@/types/substitutes'
import { volunteerForSub } from '@/app/actions/substitute/volunteer-sub'
import { withdrawVolunteer } from '@/app/actions/substitute/withdraw-volunteer'
import { confirmNominatedSub } from '@/app/actions/substitute/confirm-nominated-sub'
import { nominateSubstitute } from '@/app/actions/substitute/nominate-substitute'
import { useState } from 'react'
import { toAmPm } from '@/utils/time'
import { declineNominatedSub } from '@/app/actions/substitute/decline-nominated-sub'
import { withdrawAcceptedSub } from '@/app/actions/substitute/withdraw-accepted-sub'
import { cancelSubRequest } from '@/app/actions/substitute/cancel-request'
import { cancelNomination } from '@/app/actions/substitute/cancel-nomination'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Card } from '../ui/card'

type Props = {
	request: RequestDetail
	volunteers: Volunteer[]
	acceptedRequests: CalendarRequest[]
	availabilityMatches: AvailabilityMatch[]
	locale: string
}

export function SubstituteRequest({
	request,
	volunteers,
	acceptedRequests,
	availabilityMatches,
	locale,
}: Props) {
	const t = useTranslations('substitutes')

	const { data: session } = useSession()
	const currentUserId = session?.user?.id ?? null
	const [busy, setBusy] = useState(false)

	const isRequester = request.requestedBy.userId === currentUserId
	const isNominated =
		request.status === 'awaiting_nomination_confirmation' &&
		request.nominatedSubUserId === currentUserId

	const hasVolunteered = volunteers.some(
		(v) => v.userId === currentUserId && v.status === 'offered'
	)

	const isAccepted = request.status === 'accepted'
	const isAcceptedByMe =
		isAccepted && request.acceptedBy?.userId === currentUserId

	const requestsLocked = request.status !== 'open'

	function initials(name?: string | null) {
		if (!name) return '?'
		const parts = name.trim().split(/\s+/)
		const first = parts[0]?.[0] ?? ''
		const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
		return (first + last).toUpperCase()
	}

	/* ---------------- Actions ---------------- */

	async function handleNominate(userId: string) {
		if (busy) return
		setBusy(true)
		await nominateSubstitute(request.id, userId)
		location.reload()
	}

	async function handleCancelRequest() {
		if (busy) return
		setBusy(true)
		await cancelSubRequest(request.id)
		location.reload()
	}

	/* ---------------- Render ---------------- */

	return (
		<div className="space-y-4">
			<Card className="p-5 md:p-6">
				<div className="flex flex-col gap-5">
					{/* Top row: Who + Delete */}
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-start gap-4">
							<Avatar className="h-20 w-20">
								<AvatarImage
									src={request.requestedBy.imageUrl ?? undefined}
									alt={request.requestedBy.name}
								/>
								<AvatarFallback className="text-lg">
									{initials(request.requestedBy.name)}
								</AvatarFallback>
							</Avatar>

							<div>
								<p className="text-2xl font-semibold leading-tight">
									{request.requestedBy.name}
								</p>
								<p className="text-base text-muted-foreground">
									Needs a substitute
								</p>

								<p className="text-base font-semibold mt-1">
									{t('shiftOn', {
										date: request.date,
										time: `${toAmPm(request.startTime)}–${toAmPm(
											request.endTime
										)}`,
									})}
								</p>
							</div>
						</div>

						{/* Cancel button (requester only) */}
						{isRequester &&
							request.status !== 'accepted' &&
							request.status !== 'cancelled' &&
							request.status !== 'expired' && (
								<Button
									variant="destructive"
									size="sm"
									disabled={busy}
									onClick={handleCancelRequest}
								>
									{t('deleteRequest')}
								</Button>
							)}
					</div>

					{/* Status row */}
					<div className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">{t('statusLabel')}:</span>

						{request.status === 'accepted' && request.acceptedBy ? (
							<div className="flex items-center gap-2 font-medium">
								<Avatar className="h-5 w-5">
									<AvatarImage
										src={request.acceptedBy.imageUrl ?? undefined}
										alt={request.acceptedBy.name}
									/>
									<AvatarFallback className="text-[10px]">
										{initials(request.acceptedBy.name)}
									</AvatarFallback>
								</Avatar>

								<span>
									{t('statusAcceptedBy', {
										name: request.acceptedBy.name,
									})}
								</span>
							</div>
						) : (
							<span className="font-medium">
								{t(`status.${request.status}`)}
							</span>
						)}
					</div>
				</div>
			</Card>

			<Separator />

			{/* ================= Nominated Consultant ================= */}
			{isNominated && (
				<div className="border rounded p-4 space-y-2 bg-(--orange-accent-soft) border-(--orange-accent)">
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarImage
								src={request.requestedBy.imageUrl ?? undefined}
								alt={request.requestedBy.name}
							/>
							<AvatarFallback>
								{initials(request.requestedBy.name)}
							</AvatarFallback>
						</Avatar>

						<div className="font-medium">
							{t('askedToCover', {
								name: request.requestedBy.name ?? t('unknownUser'),
							})}
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							type="button"
							disabled={busy}
							onClick={async () => {
								setBusy(true)
								await confirmNominatedSub(request.id)
								location.reload()
							}}
						>
							{t('confirm')}
						</Button>

						<Button
							type="button"
							variant="destructive"
							onClick={async () => {
								setBusy(true)
								await declineNominatedSub(request.id)
								location.reload()
							}}
						>
							{t('decline')}
						</Button>
					</div>
				</div>
			)}

			{/* {acceptedRequests.length > 0 && (
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold">{t('substituteConfirmed')}</h2>

					<ul className="space-y-2">
						{acceptedRequests.map((r) => (
							<li
								key={r.id}
								className="flex items-center justify-between border rounded p-3 bg-green-50 border-green-300"
							>
								<div>
									<div className="font-medium">
										{format(parseISO(r.date), 'EEE MMM d')} ·{' '}
										{toAmPm(r.startTime)}–{toAmPm(r.endTime)}
									</div>

									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Avatar className="h-5 w-5">
											<AvatarImage
												src={r.requestedBy.imageUrl ?? undefined}
												alt={r.requestedBy.name}
											/>
											<AvatarFallback className="text-[10px]">
												{initials(r.requestedBy.name)}
											</AvatarFallback>
										</Avatar>

										<span>
											{t('requestedBy')}{' '}
											<span className="font-medium">{r.requestedBy.name}</span>
										</span>
									</div>
								</div>

								<Link
									href={`/${locale}/substitutes/request/${r.id}`}
									className="text-sm underline text-green-700"
								>
									{t('viewDetails')}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)} */}

			{/* ================= Volunteer Actions ================= */}
			{request.status === 'open' && !isRequester && !isNominated && (
				<div>
					{hasVolunteered ? (
						<div className="border rounded p-4 space-y-2 bg-(--purple-accent-soft) border-(--purle-accent)">
							<div className="font-medium">{t('youVolunteered')}</div>

							<Button
								type="button"
								variant="destructive"
								disabled={busy}
								onClick={async () => {
									setBusy(true)
									await withdrawVolunteer(request.id)
									location.reload()
								}}
							>
								{t('withdrawOffer')}
							</Button>
						</div>
					) : (
						<div className="border rounded p-4 space-y-4 bg-(--blue-accent-soft) border-(--blue-accent)">
							<p>
								By clicking volunteer, you are adding your name to a list of
								consultants who are willing to cover this shift. The requester
								will then accept your offer to confirm. The status will remain
								open in the meantime.
							</p>
							<Button
								type="button"
								size="lg"
								disabled={busy}
								onClick={async () => {
									setBusy(true)
									await volunteerForSub(request.id)
									location.reload()
								}}
							>
								{t('volunteer')}
							</Button>
						</div>
					)}
				</div>
			)}

			{/* ================= Requester: Accept Volunteer ================= */}
			{isRequester &&
				request.status === 'awaiting_request_confirmation' &&
				volunteers.some((v) => v.status === 'offered') && (
					<div className="border rounded p-4 space-y-3 bg-(--green-logo-soft) border-(--green-logo)">
						<div className="font-medium">{t('volunteersAvailable')}</div>

						<ul className="space-y-2">
							{volunteers
								.filter((v) => v.status === 'offered')
								.map((v) => (
									<li
										key={v.userId}
										className="flex items-center justify-between gap-2"
									>
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={v.imageUrl ?? undefined} />
												<AvatarFallback>{initials(v.fullName)}</AvatarFallback>
											</Avatar>
											<span>{v.fullName}</span>
										</div>

										<Button
											size="sm"
											disabled={busy}
											onClick={async () => {
												setBusy(true)
												await import(
													'@/app/actions/substitute/accept-volunteer'
												).then(({ acceptVolunteer }) =>
													acceptVolunteer(request.id, v.userId)
												)
												location.reload()
											}}
										>
											{t('accept')}
										</Button>
									</li>
								))}
						</ul>
					</div>
				)}

			{/* ================= Volunteer: Waiting for Requester ================= */}
			{!isRequester &&
				hasVolunteered &&
				request.status === 'awaiting_request_confirmation' && (
					<div className="border rounded p-4 space-y-2 bg-(--purple-accent-soft) border-(--purple-accent)">
						<div className="font-medium">{t('youVolunteered')}</div>

						<div className="text-sm text-muted-foreground">
							{t('waitingForRequester')}
						</div>

						<Button
							type="button"
							variant="destructive"
							disabled={busy}
							onClick={async () => {
								setBusy(true)
								await withdrawVolunteer(request.id)
								location.reload()
							}}
						>
							{t('withdrawOffer')}
						</Button>
					</div>
				)}

			{/* ================= Accepted By Me ================= */}
			{isAcceptedByMe && (
				<div className="border rounded p-4 space-y-2 bg-(--green-logo-soft) border-(--green-logo)">
					<div className="font-medium">{t('youAreCovering')}</div>

					<Button
						type="button"
						variant="destructive"
						disabled={busy}
						onClick={async () => {
							setBusy(true)
							await withdrawAcceptedSub(request.id)
							location.reload()
						}}
					>
						{t('withdrawFromShift')}
					</Button>
				</div>
			)}

			{/* ================= Requester: Availability Matches ================= */}
			{isRequester &&
				request.status !== 'accepted' &&
				request.status !== 'cancelled' &&
				request.status !== 'expired' &&
				availabilityMatches.length > 0 && (
					<>
						<h3 className="text-xl font-semibold">
							{t('availableConsultants')}
						</h3>
						<p>
							Requesting a consultant makes this request private. When you click
							Request, the shift is removed from the public substitute calendar
							and shown only to the consultant you selected. You may request one
							consultant at a time. If you want the shift to remain visible to
							all consultants, do not click Request below. If you have already
							asked a consultant to cover your shift, this would be the place to
							request it so that they show up in the system as your substitute.
						</p>

						<ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{availabilityMatches.map((m) => {
								const alreadyRequested =
									request.status === 'awaiting_nomination_confirmation' &&
									request.nominatedSubUserId === m.user.userId

								return (
									<li
										key={m.user.userId}
										className="flex items-center justify-between border rounded p-3"
									>
										<div className="flex items-center gap-2">
											<Avatar>
												<AvatarImage
													src={m.user.imageUrl ?? undefined}
													alt={m.user.name}
												/>
												<AvatarFallback>{initials(m.user.name)}</AvatarFallback>
											</Avatar>

											<span className="font-medium">{m.user.name}</span>

											{m.matchLevel !== 'none' && (
												<span className="text-sm text-muted-foreground">
													({t(`availability.${m.matchLevel}`)})
												</span>
											)}
										</div>

										{alreadyRequested ? (
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={busy}
												onClick={async () => {
													setBusy(true)
													await cancelNomination(request.id)
													location.reload()
												}}
											>
												{t('cancelRequest')}
											</Button>
										) : (
											<Button
												type="button"
												size="sm"
												disabled={busy || requestsLocked}
												onClick={() => handleNominate(m.user.userId)}
											>
												{t('request')}
											</Button>
										)}
									</li>
								)
							})}
						</ul>
					</>
				)}
		</div>
	)
}
