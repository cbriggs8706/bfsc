// components/admin/user-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'

const ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const
type Role = (typeof ROLES)[number]

interface UserFormProps {
	locale: string
	user?: {
		id: string
		name: string | null
		email: string
		username: string | null
		role: string
	}
}

export function UserForm({ locale, user }: UserFormProps) {
	const router = useRouter()

	const isEditing = Boolean(user)

	const [name, setName] = useState(user?.name ?? '')
	const [email, setEmail] = useState(user?.email ?? '')
	const [username, setUsername] = useState(user?.username ?? '')
	const [role, setRole] = useState<Role>(
		user && ROLES.includes(user.role as Role) ? (user.role as Role) : 'Patron'
	)

	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// --------------------------------------------
	// SUBMIT HANDLER (CREATE OR EDIT)
	// --------------------------------------------
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsSaving(true)
		setError(null)

		try {
			const url = isEditing
				? `/api/admin/users/${user!.id}`
				: `/api/admin/users`

			const method = isEditing ? 'PATCH' : 'POST'

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim() || null,
					email: email.trim(),
					username: username.trim() || null,
					role,
				}),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => null)
				throw new Error(
					data?.error ||
						(isEditing ? 'Unable to update user' : 'Unable to create user')
				)
			}

			router.push(`/${locale}/admin/users`)
			router.refresh()
		} catch (err) {
			console.error(err)
			setError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setIsSaving(false)
		}
	}

	// --------------------------------------------
	// DELETE HANDLER
	// --------------------------------------------
	async function handleDelete() {
		if (!user) return
		if (!confirm('Are you sure you want to delete this user?')) return

		const res = await fetch(`/api/admin/users/${user.id}`, {
			method: 'DELETE',
		})

		if (res.ok) {
			router.push(`/${locale}/admin/users`)
			router.refresh()
		} else {
			setError('Failed to delete user')
		}
	}

	// --------------------------------------------
	// UI
	// --------------------------------------------
	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="User's name"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="user@example.com"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="username">Username</Label>
				<Input
					id="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="optional username"
				/>
			</div>

			<div className="space-y-2">
				<Label>Role</Label>
				<Select value={role} onValueChange={(v) => setRole(v as Role)}>
					<SelectTrigger>
						<SelectValue placeholder="Select a role" />
					</SelectTrigger>
					<SelectContent>
						{ROLES.map((r) => (
							<SelectItem key={r} value={r}>
								{r}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push(`/${locale}/admin/users`)}
					disabled={isSaving}
				>
					Cancel
				</Button>

				<div className="flex gap-2">
					{isEditing && (
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isSaving}
						>
							Delete
						</Button>
					)}

					<Button type="submit" disabled={isSaving}>
						{isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create User'}
					</Button>
				</div>
			</div>
		</form>
	)
}
