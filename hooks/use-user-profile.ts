'use client'

import { useEffect, useState } from 'react'
import { getUserDetails } from '@/app/actions/get-user-details'
import type { UserDetailsData } from '@/components/auth/AuthUserDetails'

export function useUserProfile() {
	const [profile, setProfile] = useState<UserDetailsData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		getUserDetails().then((data) => {
			if (mounted) {
				setProfile(data)
				setLoading(false)
			}
		})

		return () => {
			mounted = false
		}
	}, [])

	return { profile, loading }
}
