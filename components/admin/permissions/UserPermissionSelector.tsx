'use client'

import { useState } from 'react'
import {
	Command,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GrantPermissionForm } from '@/components/admin/permissions/GrantPermissionForm'

type UserRow = {
	id: string
	name: string | null
	email: string
	role: string
}

type Grant = {
	id?: string
	permission: string
	endsAt?: Date | null
}

export function UserPermissionSelector({
	users,
	grantsByUser,
	locale,
}: {
	users: UserRow[]
	grantsByUser: Record<string, Grant[]>
	locale: string
}) {
	const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)

	return (
		<Card>
			<CardContent className="space-y-4">
				{/* User selector */}
				<Command className="border rounded-md">
					<CommandInput placeholder="Search users by name or email…" />
					<CommandList>
						{users.map((u) => (
							<CommandItem
								key={u.id}
								value={`${u.name ?? ''} ${u.email}`}
								onSelect={() => setSelectedUser(u)}
							>
								<div className="flex flex-col">
									<span>{u.name}</span>
									<span className="text-xs text-muted-foreground">
										{u.role}
									</span>
								</div>
							</CommandItem>
						))}
					</CommandList>
				</Command>

				{/* Selected user editor */}
				{selectedUser && (
					<GrantPermissionForm
						key={selectedUser.id} // 🔑 THIS IS THE FIX
						user={selectedUser}
						initialGrants={grantsByUser[selectedUser.id] ?? []}
						locale={locale}
					/>
				)}
			</CardContent>
		</Card>
	)
}
