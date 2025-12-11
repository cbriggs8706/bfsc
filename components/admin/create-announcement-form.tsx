'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ROLES, Role } from '@/types/announcements'
import { createAnnouncement } from '@/app/actions/announcements'
import { DayPicker } from 'react-day-picker'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadAnnouncementImage } from '@/utils/upload-announcement-image'

interface CreateAnnouncementFormProps {
	onCreated?: () => void
}

export function CreateAnnouncementForm({
	onCreated,
}: CreateAnnouncementFormProps) {
	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [selectedRoles, setSelectedRoles] = useState<Role[]>([])
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const toggleRole = (role: Role) => {
		setSelectedRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
		)
	}

	async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const url = await uploadAnnouncementImage(file)
			setImageUrl(url)
			toast.success('Image uploaded!')
		} catch (err) {
			console.error(err)
			toast.error('Image upload failed.')
		}
		setUploading(false)
	}

	async function onSubmit() {
		if (!title || !body) {
			toast.error('Title and message are required.')
			return
		}

		setSubmitting(true)

		try {
			await createAnnouncement({
				title,
				body,
				roles: selectedRoles.length ? selectedRoles : ROLES,
				expiresAt: expiresAt ? expiresAt.toISOString() : null,
				imageUrl,
			})

			toast.success('Announcement created!')
			onCreated?.()
			setTitle('')
			setBody('')
			setSelectedRoles([])
			setExpiresAt(undefined)
			setImageUrl(null)
		} catch (err) {
			toast.error('Failed to create announcement.')
			console.error(err)
		}

		setSubmitting(false)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Announcement</CardTitle>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Title */}
				<div className="space-y-2">
					<Label>Title</Label>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} />
				</div>

				{/* Body */}
				<div className="space-y-2">
					<Label>Message</Label>
					<Textarea
						value={body}
						rows={5}
						onChange={(e) => setBody(e.target.value)}
					/>
				</div>

				{/* Image Upload */}
				<div className="space-y-2">
					<Label>Image (optional)</Label>

					<Input type="file" accept="image/*" onChange={handleImageUpload} />

					{imageUrl && (
						<div className="mt-2 relative w-48 h-32">
							<Image
								src={imageUrl}
								alt="Announcement image preview"
								fill
								className="object-cover rounded-md"
							/>
						</div>
					)}

					{uploading && (
						<p className="text-sm text-muted-foreground">Uploading…</p>
					)}
				</div>

				{/* Roles */}
				<div className="space-y-2">
					<Label>Visible to Roles</Label>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{ROLES.map((role) => (
							<div
								key={role}
								className="flex items-center justify-between p-2 border rounded-md"
							>
								<span className="text-sm">{role}</span>
								<Switch
									checked={selectedRoles.includes(role)}
									onCheckedChange={() => toggleRole(role)}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Expiration */}
				<div className="space-y-2">
					<Label>Expiration Date (optional)</Label>

					<div className="border rounded-md p-3">
						<DayPicker
							mode="single"
							selected={expiresAt}
							onSelect={setExpiresAt}
						/>
					</div>

					<Button
						variant="secondary"
						size="sm"
						onClick={() => setExpiresAt(undefined)}
					>
						Clear expiration
					</Button>
				</div>

				<Button
					className="w-full"
					onClick={onSubmit}
					disabled={submitting || uploading}
				>
					{submitting ? 'Saving…' : 'Create Announcement'}
				</Button>
			</CardContent>
		</Card>
	)
}
