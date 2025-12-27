// components/admin/permissions/GrantPermissionForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { PERMISSIONS } from '@/lib/permissions/registry'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { saveUserPermissionGrants } from '@/lib/actions/permissions/save-user-permission-grants'
import { useRouter } from 'next/navigation'

type Grant = {
	id?: string
	permission: string
	endsAt?: Date | null
}

export function GrantPermissionForm({
	user,
	initialGrants,
	locale,
}: {
	user: {
		id: string
		name: string | null
		email: string
		role: string
	}
	initialGrants: Grant[]
	locale: string
}) {
	const router = useRouter()
	const t = useTranslations('permissions')

	const [grants, setGrants] = useState<Grant[]>(
		initialGrants.map((g) => ({
			permission: g.permission,
			endsAt: g.endsAt ?? null,
		}))
	)

	const [saving, setSaving] = useState(false)

	const isDirty = useMemo(() => {
		if (grants.length !== initialGrants.length) return true
		return grants.some(
			(g) =>
				!initialGrants.find(
					(i) =>
						i.permission === g.permission &&
						(i.endsAt?.toString() ?? null) === (g.endsAt?.toString() ?? null)
				)
		)
	}, [grants, initialGrants])

	function toggle(permission: string, enabled: boolean) {
		setGrants((prev) =>
			enabled
				? [...prev, { permission, endsAt: null }]
				: prev.filter((g) => g.permission !== permission)
		)
	}

	function setExpiry(permission: string, value: string) {
		setGrants((prev) =>
			prev.map((g) =>
				g.permission === permission
					? {
							...g,
							endsAt: value ? new Date(value) : null,
					  }
					: g
			)
		)
	}

	async function onSave() {
		setSaving(true)
		await saveUserPermissionGrants(locale, user.id, grants)
		setSaving(false)
		router.refresh()
	}

	const grouped = useMemo(() => {
		return PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((acc, p) => {
			if (!acc[p.category]) acc[p.category] = []
			acc[p.category].push(p)
			return acc
		}, {})
	}, [])

	return (
		<div className="border rounded-lg p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">
						{user.name} - {user.role}
					</h2>
					<p className="text-sm text-muted-foreground mr-4">
						Already has all the permissions of a{' '}
						<span className="text-base font-bold">{user.role}</span> which do
						not reflect here. Additional permissions may be granted below. If no
						date entered, permission will be granted until deselected.
					</p>
				</div>

				<Button
					onClick={onSave}
					disabled={!isDirty || saving}
					variant={isDirty ? 'default' : 'secondary'}
				>
					{saving
						? t('ui.saving', { default: 'Saving…' })
						: t('ui.save', { default: 'Save' })}
				</Button>
			</div>

			<div className="flex flex-wrap">
				{Object.entries(grouped).map(([category, perms]) => (
					<div key={category} className="flex flex-col w-full lg:w-1/2">
						<h3 className="text-lg font-semibold mb-3">
							{t(`categories.${category}`)}
						</h3>

						<div className="space-y-3">
							{perms.map((p) => {
								const [domain, action] = p.key.split('.')
								const grant = grants.find((g) => g.permission === p.key)

								return (
									<div key={p.key} className="flex items-center gap-4">
										<Checkbox
											checked={!!grant}
											onCheckedChange={(val) => toggle(p.key, Boolean(val))}
										/>

										<div className="flex-1">
											<div>{t(`labels.${domain}.${action}`)}</div>
											<div className="text-xs text-muted-foreground">
												{t(`descriptions.${domain}.${action}`, { default: '' })}
											</div>
										</div>

										{grant && (
											<Input
												type="date"
												className="w-40"
												value={
													grant.endsAt
														? grant.endsAt.toISOString().slice(0, 10)
														: ''
												}
												onChange={(e) => setExpiry(p.key, e.target.value)}
											/>
										)}
									</div>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
