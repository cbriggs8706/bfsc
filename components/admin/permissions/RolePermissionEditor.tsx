// components/admin/permissions/roles/RolePermissionEditor.tsx
'use client'

import { useMemo, useState } from 'react'
import { PERMISSIONS } from '@/lib/permissions/registry'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { saveRolePermissions } from '@/lib/actions/permissions/save-role-permissions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function RolePermissionEditor({
	role,
	initialPermissions,
	locale,
}: {
	role: string
	initialPermissions: string[]
	locale: string
}) {
	const t = useTranslations('permissions')

	const [current, setCurrent] = useState<string[]>(initialPermissions)
	const [saving, setSaving] = useState(false)

	// All permission keys (once)
	const allPermissionKeys = useMemo(() => PERMISSIONS.map((p) => p.key), [])

	// Dirty detection
	const isDirty = useMemo(() => {
		if (current.length !== initialPermissions.length) return true
		return current.some((p) => !initialPermissions.includes(p))
	}, [current, initialPermissions])

	const grouped = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>(
		(acc, p) => {
			if (!acc[p.category]) acc[p.category] = []
			acc[p.category].push(p)
			return acc
		},
		{}
	)

	function toggle(permission: string, enabled: boolean) {
		setCurrent((prev) =>
			enabled ? [...prev, permission] : prev.filter((p) => p !== permission)
		)
	}

	function selectAll() {
		setCurrent(allPermissionKeys)
	}

	function clearAll() {
		setCurrent([])
	}

	async function onSave() {
		setSaving(true)
		await saveRolePermissions(locale, role, current)
		setSaving(false)
	}

	return (
		<Card className="">
			{/* Header */}
			<CardHeader className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-2xl font-semibold">{role}s should be able to:</h2>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={selectAll}
						disabled={current.length === allPermissionKeys.length}
					>
						{t('ui.selectAll', { default: 'Select all' })}
					</Button>

					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={clearAll}
						disabled={current.length === 0}
					>
						{t('ui.clearAll', { default: 'Clear all' })}
					</Button>

					<Button
						onClick={onSave}
						disabled={!isDirty || saving}
						variant={isDirty ? 'default' : 'secondary'}
					>
						{saving ? t('ui.saving') : t('ui.save')}
					</Button>
				</div>
			</CardHeader>

			<CardContent className="flex flex-wrap">
				{/* Permissions */}
				{Object.entries(grouped).map(([category, perms]) => (
					<div
						key={category}
						className="flex flex-col w-full md:w-1/2 lg:w-1/3"
					>
						<h3 className="text-xl font-semibold mb-2">
							{t(`categories.${category}`)}
						</h3>

						<div className="space-y-2">
							{perms.map((p) => {
								const [domain, action] = p.key.split('.')

								return (
									<label key={p.key} className="flex gap-3">
										<Checkbox
											checked={current.includes(p.key)}
											onCheckedChange={(val) => toggle(p.key, Boolean(val))}
										/>
										<div>
											<div>{t(`labels.${domain}.${action}`)}</div>
											<div className="text-xs text-muted-foreground">
												{t(`descriptions.${domain}.${action}`)}
											</div>
										</div>
									</label>
								)
							})}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
