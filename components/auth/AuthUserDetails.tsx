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
import { fetchFaithTree } from '@/app/actions/get-faith-tree'

export interface UserDetailsData {
	// kiosk_people
	kioskPersonId?: string
	profileImageUrl?: string | null
	languagesSpoken?: string[]
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

export default function UserDetails() {
	const [details, setDetails] = useState<UserDetailsData | null>(null)
	const [faithTree, setFaithTree] = useState<Faith[]>([])
	const hasAttemptedLinkRef = useRef(false)

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
		<>
			{details && (
				<AvatarCard
					kioskPersonId={details.kioskPersonId!}
					name={details.name}
					profileImageUrl={details.profileImageUrl ?? null}
					onUpdated={reloadDetails}
				/>
			)}
			{details && <AccountCard details={details} onUpdated={reloadDetails} />}

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
					onUpdated={reloadDetails}
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
		</>
	)
}
