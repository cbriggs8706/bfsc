'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ROLES, Role } from '@/types/announcements'
import { DayPicker } from 'react-day-picker'
import { updateAnnouncement } from '@/app/actions/announcements'
import { toast } from 'sonner'
import Image from 'next/image'
import { uploadAnnouncementImage } from '@/utils/upload-announcement-image'

interface EditAnnouncementFormProps {
	announcement: {
		id: string
		title: string
		body: string
		roles: Role[]
		imageUrl?: string | null
		expiresAt?: string | null
	}
	onUpdated: () => void
}

export function EditAnnouncementForm({
	announcement,
	onUpdated,
}: EditAnnouncementFormProps) {
	const [title, setTitle] = useState(announcement.title)
	const [body, setBody] = useState(announcement.body)
	const [roles, setRoles] = useState<Role[]>(announcement.roles)
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(
		announcement.expiresAt ? new Date(announcement.expiresAt) : undefined
	)
	const [imageUrl, setImageUrl] = useState(announcement.imageUrl)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)

	const toggleRole = (role: Role) =>
		setRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
		)

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const url = await uploadAnnouncementImage(file)
			setImageUrl(url)
			toast.success('Image uploaded')
		} finally {
			setUploading(false)
		}
	}

	const submit = async () => {
		setSaving(true)
		await updateAnnouncement(announcement.id, {
			title,
			body,
			roles,
			imageUrl,
			expiresAt: expiresAt ? expiresAt.toISOString() : null,
		})
		setSaving(false)
		toast.success('Announcement updated')
		onUpdated()
	}

	return (
		<div className="space-y-6">
			<div>
				<Label>Title</Label>
				<Input value={title} onChange={(e) => setTitle(e.target.value)} />
			</div>

			<div>
				<Label>Message</Label>
				<Textarea
					value={body}
					rows={5}
					onChange={(e) => setBody(e.target.value)}
				/>
			</div>

			{/* Image */}
			<div>
				<Label>Image</Label>
				<Input type="file" accept="image/*" onChange={handleImageUpload} />
				{imageUrl && (
					<div className="relative w-48 h-32 mt-2">
						<Image
							src={imageUrl}
							alt=""
							fill
							className="rounded object-cover"
						/>
					</div>
				)}
			</div>

			{/* Roles */}
			<div className="space-y-2">
				<Label>Visible to Roles</Label>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
					{ROLES.map((role) => (
						<label
							key={role}
							className="flex items-center justify-between p-2 border rounded"
						>
							<span>{role}</span>
							<Switch
								checked={roles.includes(role)}
								onCheckedChange={() => toggleRole(role)}
							/>
						</label>
					))}
				</div>
			</div>

			{/* Expiration */}
			<div>
				<Label>Expiration</Label>
				<div className="border rounded p-2">
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
				onClick={submit}
				disabled={saving || uploading}
				className="w-full"
			>
				{saving ? 'Saving…' : 'Save Changes'}
			</Button>
		</div>
	)
}
