// components/admin/announcements/AnnouncementForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'

import { ROLES, type Role } from '@/types/announcements'
import { uploadAnnouncementImage } from '@/utils/upload-announcement-image'
import type { UIAnnouncement } from '@/db/queries/announcements'
import type {
	AnnouncementCreateInput,
	AnnouncementUpdateInput,
} from '@/db/queries/announcements'

type Mode = 'create' | 'read' | 'update' | 'delete'

type Props =
	| {
			mode: 'create'
			initial?: undefined
			onSubmit: (input: AnnouncementCreateInput) => Promise<void>
			onDoneHref: string
	  }
	| {
			mode: 'update'
			initial: UIAnnouncement
			onSubmit: (input: AnnouncementUpdateInput) => Promise<void>
			onDoneHref: string
	  }
	| {
			mode: 'read' | 'delete'
			initial: UIAnnouncement
			onSubmit?: undefined
			onDoneHref: string
	  }

export function AnnouncementForm(props: Props) {
	const router = useRouter()

	const hasInitial =
		props.mode === 'update' || props.mode === 'read' || props.mode === 'delete'

	const readOnly = props.mode === 'read' || props.mode === 'delete'

	const initialTitle = hasInitial ? props.initial.title : ''
	const initialBody = hasInitial ? props.initial.body : ''
	const initialRoles = hasInitial ? props.initial.roles : ([] as Role[])
	const initialImageUrl = hasInitial ? props.initial.imageUrl ?? null : null
	const initialExpiresAt = hasInitial ? props.initial.expiresAt ?? null : null

	const [title, setTitle] = useState(initialTitle)
	const [body, setBody] = useState(initialBody)
	const [roles, setRoles] = useState<Role[]>(initialRoles)
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(
		initialExpiresAt ?? undefined
	)
	const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl)

	const [uploading, setUploading] = useState(false)
	const [saving, setSaving] = useState(false)

	const rolesEmpty = useMemo(() => roles.length === 0, [roles])

	const toggleRole = (role: Role) => {
		if (readOnly) return
		setRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
		)
	}

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (readOnly) return

		const file = e.target.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const url = await uploadAnnouncementImage(file)
			setImageUrl(url)
			toast.success('Image uploaded')
		} catch (err) {
			console.error(err)
			toast.error('Image upload failed')
		} finally {
			setUploading(false)
		}
	}

	const submit = async () => {
		if (!('onSubmit' in props) || !props.onSubmit) {
			return
		}

		if (!title.trim() || !body.trim()) {
			toast.error('Title and message are required.')
			return
		}

		setSaving(true)
		try {
			if (props.mode === 'create') {
				const input: AnnouncementCreateInput = {
					title: title.trim(),
					body: body.trim(),
					roles: rolesEmpty ? ROLES : roles,
					imageUrl,
					expiresAt: expiresAt ?? null,
				}
				await props.onSubmit(input)
			} else {
				const input: AnnouncementUpdateInput = {
					title: title.trim(),
					body: body.trim(),
					roles: rolesEmpty ? ROLES : roles,
					imageUrl,
					expiresAt: expiresAt ?? null,
				}
				await props.onSubmit(input)
			}

			toast.success(props.mode === 'create' ? 'Created!' : 'Updated!')
			router.push(props.onDoneHref)
			router.refresh()
		} catch (err) {
			console.error(err)
			toast.error('Save failed.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<Label>Title</Label>
					<Input
						value={title}
						disabled={readOnly}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label>Message</Label>
					<Textarea
						value={body}
						rows={5}
						disabled={readOnly}
						onChange={(e) => setBody(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label>Image (optional)</Label>
					<Input
						type="file"
						accept="image/*"
						disabled={readOnly}
						onChange={handleImageUpload}
					/>

					{imageUrl && (
						<div className="w-full max-w-sm">
							<img
								src={imageUrl}
								alt=""
								className="block w-full h-auto rounded-md"
							/>
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Label>Visible to Roles</Label>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{ROLES.map((r) => (
							<label
								key={r}
								className="flex items-center justify-between p-2 border rounded-md"
							>
								<span className="text-sm">{r}</span>
								<Switch
									checked={roles.includes(r)}
									disabled={readOnly}
									onCheckedChange={() => toggleRole(r)}
								/>
							</label>
						))}
					</div>
				</div>

				<div className="space-y-2">
					<Label>Expiration Date (optional)</Label>
					<div className="border rounded-md p-3">
						<Calendar
							mode="single"
							selected={expiresAt}
							onSelect={readOnly ? undefined : setExpiresAt}
							disabled={readOnly}
						/>
					</div>

					<Button
						variant="secondary"
						size="sm"
						disabled={readOnly}
						onClick={() => setExpiresAt(undefined)}
					>
						Clear expiration
					</Button>
				</div>

				{!readOnly && (
					<Button
						className="w-full"
						onClick={submit}
						disabled={saving || uploading}
					>
						{saving ? 'Saving…' : 'Save'}
					</Button>
				)}
			</CardContent>
		</Card>
	)
}
