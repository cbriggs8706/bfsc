'use client'

import { useEffect, useRef, useState } from 'react'
import { getUserDetails } from '@/app/actions/get-user-details'
import { Faith } from '@/types/faiths'
import { FaithCard } from './FaithCard'
import { AccountCard } from './AccountCard'
import { KioskAccessCard } from './KioskAccessCard'
import { LanguagesCard } from './LanguagesCard'
import { PidCard } from './PidCard'
import { AvatarCard } from './AvatarCard'
import { SpecialtiesCard } from './SpecialtiesCard'
import { fetchFaithTree } from '@/app/actions/get-faith-tree'
import type { CountryCode } from 'libphonenumber-js'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export interface UserDetailsData {
	// kiosk_people
	kioskPersonId?: string
	profileImageUrl?: string | null
	languagesSpoken?: string[]
	researchSpecialties?: string[]
	pid?: string | null
	phone?: string | null
	passcode?: string | null
	faithId?: string | null
	wardId?: string | null

	// user
	id: string
	name: string | null
	username: string | null
	email: string
	role: string
	hasPassword: boolean

	// auth/meta
	providers?: string[]
	createdAt?: string | Date
	lastLogin?: string | Date
}

type Props = {
	countryCode: CountryCode
}

export default function UserDetails({ countryCode }: Props) {
	const t = useTranslations('auth')
	const [details, setDetails] = useState<UserDetailsData | null>(null)
	const [faithTree, setFaithTree] = useState<Faith[]>([])
	const hasAttemptedLinkRef = useRef(false)

	const completionChecks = [
		Boolean(details?.name?.trim()),
		Boolean(details?.username?.trim()),
		Boolean(details?.email?.trim()),
		Boolean(details?.profileImageUrl?.trim()),
		Boolean(details?.phone?.trim()),
		Boolean(details?.passcode?.trim()),
		Boolean(details?.pid?.trim()),
		Boolean(details?.faithId),
		Boolean(details?.wardId),
		(details?.languagesSpoken?.length ?? 0) > 0,
		(details?.researchSpecialties?.length ?? 0) > 0,
	]
	const completedProfileFields = completionChecks.filter(Boolean).length
	const totalProfileFields = completionChecks.length
	const profileCompletionPercent =
		totalProfileFields > 0
			? Math.round((completedProfileFields / totalProfileFields) * 100)
			: 0

	const reloadDetails = async () => {
		setDetails(await getUserDetails())
	}

	useEffect(() => {
		let active = true

		const load = async () => {
			const [details, faiths] = await Promise.all([
				getUserDetails(),
				fetchFaithTree(),
			])

			if (!active) return

			setDetails(details)
			setFaithTree(faiths)
		}

		load()

		return () => {
			active = false
		}
	}, [])

	useEffect(() => {
		if (!details) return
		if (details.kioskPersonId) return
		if (hasAttemptedLinkRef.current) return

		hasAttemptedLinkRef.current = true

		const linkKioskProfile = async () => {
			try {
				await fetch('/api/kiosk/identify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: `user:${details.id}` }),
				})

				// Reload details AFTER linking
				const refreshed = await getUserDetails()
				setDetails(refreshed)
			} catch (err) {
				console.error('Failed to auto-link kiosk profile', err)
			}
		}

		linkKioskProfile()
	}, [details])

	return (
		<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
			{details && (
				<AvatarCard
					kioskPersonId={details.kioskPersonId!}
					name={details.name}
					profileImageUrl={details.profileImageUrl ?? null}
					onUpdated={reloadDetails}
				/>
			)}
			{details && <AccountCard details={details} onUpdated={reloadDetails} />}
			{details && (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 p-5 text-center md:p-6">
							<ProgressCircle
								percent={profileCompletionPercent}
								ariaLabel={t('account.completionAriaLabel', {
									percent: profileCompletionPercent,
								})}
							/>
							<div>
								<p className="text-sm font-medium md:text-base">
									{t('account.completionTitle')}
								</p>
								<p className="text-sm text-muted-foreground">
									{t('account.completionFields', {
										completed: completedProfileFields,
										total: totalProfileFields,
									})}
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{details?.kioskPersonId && (
				<FaithCard
					kioskPersonId={details.kioskPersonId}
					faithTree={faithTree}
					faithId={details.faithId ?? null}
					wardId={details.wardId ?? null}
					onUpdated={reloadDetails}
				/>
			)}

			{details?.kioskPersonId && (
				<KioskAccessCard
					kioskPersonId={details.kioskPersonId}
					phone={details.phone ?? null}
					passcode={details.passcode ?? null}
					role={details.role}
					onUpdated={reloadDetails}
					countryCode={countryCode}
				/>
			)}

			{details?.kioskPersonId && (
				<LanguagesCard
					kioskPersonId={details.kioskPersonId}
					languages={details.languagesSpoken ?? []}
					onUpdated={reloadDetails}
				/>
			)}
			{details?.kioskPersonId && (
				<PidCard
					kioskPersonId={details.kioskPersonId}
					pid={details.pid ?? undefined}
					onUpdated={reloadDetails}
				/>
			)}
			{details?.kioskPersonId && (
				<div className="lg:col-span-2 xl:col-span-3">
					<SpecialtiesCard
						kioskPersonId={details.kioskPersonId}
						specialties={details.researchSpecialties ?? []}
						onUpdated={reloadDetails}
					/>
				</div>
			)}
		</div>
	)
}

function ProgressCircle({
	percent,
	ariaLabel,
}: {
	percent: number
	ariaLabel: string
}) {
	const radius = 48
	const stroke = 12
	const size = 128
	const circumference = 2 * Math.PI * radius
	const offset = circumference - (percent / 100) * circumference

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0"
			role="img"
			aria-label={ariaLabel}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				className="stroke-muted-foreground/30"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={stroke}
				fill="none"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="stroke-primary"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
			<text
				x="50%"
				y="50%"
				textAnchor="middle"
				dominantBaseline="central"
				className="fill-current text-20 font-medium"
			>
				{percent}%
			</text>
		</svg>
	)
}
