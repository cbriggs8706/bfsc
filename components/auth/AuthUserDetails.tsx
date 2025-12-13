'use client'

import { useEffect, useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { updateUserProfile } from '@/app/actions/update-user-profile'
import { changePassword } from '@/app/actions/change-password'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserDetails } from '@/app/actions/get-user-details'
import { uploadProfileImage } from '@/utils/upload-profile-image'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'

export interface UserDetailsData {
	// kiosk_people (optional)
	kioskPersonId?: string
	profileImageUrl?: string | null

	// user
	id: string
	name: string | null
	username: string | null
	email: string
	role: string

	// auth / meta
	providers?: string[]
	createdAt?: string | Date
	lastLogin?: string | Date
}

export default function UserDetails() {
	const { data: session, update: refreshSession } = useSession()

	const [name, setName] = useState('')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [details, setDetails] = useState<UserDetailsData | null>(null)

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const [isOpen, setIsOpen] = useState(false)
	const [preview, setPreview] = useState<string | null>(null)
	const [file, setFile] = useState<File | null>(null)

	const [isPending, startTransition] = useTransition()

	const isCredentialsUser = session?.user?.authProvider === 'credentials'

	// Load full DB user details
	useEffect(() => {
		async function load() {
			const data = await getUserDetails()
			setDetails(data)
			console.log('USER DETAILS FROM SERVER', data)
		}
		load()
	}, [isOpen]) // refresh on open

	// Pre-fill dialog
	useEffect(() => {
		if (isOpen && session?.user) {
			setName(session.user.name ?? '')
			setUsername(session.user.username ?? '')
			setEmail(session.user.email ?? '')
		}
	}, [isOpen, session])

	// --------------------------
	// FILE SELECTION
	// --------------------------
	const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0]
		if (!selected) return
		setFile(selected)
		setPreview(URL.createObjectURL(selected))
	}

	// --------------------------
	// SAVE PROFILE
	// --------------------------
	const onSaveProfile = () => {
		startTransition(async () => {
			try {
				let uploadedProfileImageUrl: string | undefined

				// 1️⃣ Upload to Supabase Storage
				if (file) {
					uploadedProfileImageUrl = await uploadProfileImage(file)
				}

				// 2️⃣ Persist image URL to kiosk_people
				if (uploadedProfileImageUrl && details?.kioskPersonId) {
					await updateKioskProfile({
						kioskPersonId: details.kioskPersonId,
						profileImageUrl: uploadedProfileImageUrl,
					})
				}

				// 3️⃣ Update public.user (NO image)
				const userPayload: {
					name?: string
					username?: string
					email?: string
				} = {}

				if (name !== session?.user?.name) userPayload.name = name
				if (username !== session?.user?.username)
					userPayload.username = username
				if (email !== session?.user?.email) userPayload.email = email

				if (Object.keys(userPayload).length > 0) {
					await updateUserProfile(userPayload)
				}

				// 4️⃣ Refresh client state
				await refreshSession()

				// 5️⃣ Force details reload
				const refreshed = await getUserDetails()
				setDetails(refreshed)

				toast.success('Profile updated!')
				setIsOpen(false)
				setPreview(null)
				setFile(null)
			} catch (err) {
				console.error(err)
				toast.error('Failed to update profile')
			}
		})
	}

	// --------------------------
	// CHANGE PASSWORD
	// --------------------------
	const onChangePassword = () => {
		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match')
			return
		}

		startTransition(async () => {
			try {
				const res = await changePassword({
					currentPassword,
					newPassword,
				})

				if (!res?.success) throw new Error(res?.message)

				await refreshSession() // refreshes role, username, etc if changed elsewhere
				toast.success('Password updated!')

				setCurrentPassword('')
				setNewPassword('')
				setConfirmPassword('')
			} catch (err) {
				console.error(err)
				toast.error('Failed to change password')
			}
		})
	}

	const resolvedImageUrl =
		preview ?? details?.profileImageUrl ?? session?.user?.image ?? undefined

	return (
		<>
			<Card className="w-full max-w-md mx-auto shadow-md border">
				<CardHeader className="flex flex-row items-center gap-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src={resolvedImageUrl} />

						{/* <Image
							src={preview ?? session?.user?.image ?? '/mascot.svg'}
							width={120}
							height={120}
							alt="Profile"
						/> */}

						<AvatarFallback>
							{session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
						</AvatarFallback>
					</Avatar>

					<div>
						<CardTitle className="text-xl">
							{details?.name ?? session?.user?.name}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							@{details?.username ?? session?.user?.username}
						</p>
					</div>
				</CardHeader>

				<CardContent className="text-sm text-muted-foreground space-y-1">
					{details && (
						<>
							<p>
								<strong>Email:</strong> {details.email}
							</p>
							<p>
								<strong>Role:</strong> {details.role}
							</p>
							<p>
								<strong>Credentials Provider:</strong>{' '}
								{details.providers?.length
									? details.providers.join(', ').toUpperCase()
									: 'Username/Password'}
							</p>
							<p>
								<strong>Note:</strong> After saving edits you may need to logout
								and back in to see it update here.
							</p>

							{details.createdAt && (
								<p>
									<strong>Created:</strong>{' '}
									{new Date(details.createdAt).toLocaleString()}
								</p>
							)}
							{details.lastLogin && (
								<p>
									<strong>Last Login:</strong>{' '}
									{new Date(details.lastLogin).toLocaleString()}
								</p>
							)}
						</>
					)}

					<Button
						className="w-full mt-4"
						variant="default"
						onClick={() => setIsOpen(true)}
					>
						Edit Profile
					</Button>
				</CardContent>
			</Card>

			{/* ---- DIALOG ---- */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Your Profile</DialogTitle>
					</DialogHeader>

					<div className="space-y-6">
						{/* Avatar */}
						<div className="flex flex-col items-center gap-4">
							<Image
								src={resolvedImageUrl ?? '/mascot.svg'}
								alt="Preview"
								width={120}
								height={120}
								className="rounded-full border shadow-sm object-cover"
							/>

							<input
								type="file"
								accept="image/*"
								onChange={onSelectFile}
								className="block w-full text-sm text-muted-foreground 
             file:mr-4 file:py-2 file:px-4
             file:rounded-md file:border file:border-input
             file:bg-secondary file:text-secondary-foreground
             file:text-sm file:font-medium
             hover:file:bg-secondary/80
             cursor-pointer"
							/>
						</div>

						{/* Name */}
						<div>
							<label className="text-sm font-medium">Full Name</label>
							<Input value={name} onChange={(e) => setName(e.target.value)} />
						</div>

						{/* Username */}
						<div>
							<label className="text-sm font-medium">Username</label>
							<Input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>

						{/* Email */}
						<div>
							<label className="text-sm font-medium">Email</label>
							<Input value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>

						<Button
							onClick={onSaveProfile}
							disabled={isPending}
							className="w-full"
						>
							{isPending ? 'Saving...' : 'Save Profile'}
						</Button>

						{/* ---- CREDENTIALS ONLY: CHANGE PASSWORD ---- */}
						{isCredentialsUser && (
							<div className="pt-6 border-t">
								<h2 className="font-semibold mb-2">Change Password</h2>

								<div className="space-y-3">
									<Input
										type="password"
										placeholder="Current password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
									/>
									<Input
										type="password"
										placeholder="New password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
									/>
									<Input
										type="password"
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>

									<Button
										onClick={onChangePassword}
										disabled={isPending}
										className="w-full"
									>
										{isPending ? 'Updating…' : 'Update Password'}
									</Button>
								</div>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setIsOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
