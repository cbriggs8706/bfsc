// components/resource/ResourceForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Resource } from '@/types/resource'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Mode = 'create' | 'read' | 'update' | 'delete'

type Props = {
	initial?: Partial<Resource>
	mode: Mode
	onSubmit?: (data: Resource) => Promise<unknown>
	resourceId?: string
	locale?: string
}

export function ResourceForm({
	initial = {},
	mode,
	onSubmit,
	resourceId,
	locale,
}: Props) {
	const [pending, startTransition] = useTransition()
	const disabled = mode === 'read' || mode === 'delete'
	const t = useTranslations('common')

	const [form, setForm] = useState<Resource>({
		id: initial.id ?? '',
		name: initial.name ?? '',
		type: initial.type ?? 'equipment',
		defaultDurationMinutes: initial.defaultDurationMinutes ?? 120,
		maxConcurrent: initial.maxConcurrent ?? 1,
		capacity: initial.capacity ?? null,
		isActive: initial.isActive ?? true,
		description: initial.description ?? '',
		requiredItems: initial.requiredItems ?? '',
		prep: initial.prep ?? '',
		notes: initial.notes ?? '',
		link: initial.link ?? '',
	})

	function submit() {
		if (!onSubmit) return
		startTransition(async () => {
			await onSubmit(form)
		})
	}

	return (
		<Card className="p-6">
			{/* Name */}
			<div className="space-y-1">
				<Label>{t('name')}</Label>
				<Input
					value={form.name}
					disabled={disabled}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
				/>
			</div>

			{/* Type / Duration / Capacity / Active */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="space-y-1">
					<Label>{t('resource.type')}</Label>
					<Select
						value={form.type}
						disabled={disabled}
						onValueChange={(v) =>
							setForm({ ...form, type: v as Resource['type'] })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="equipment">
								{t('resource.types.equipment')}
							</SelectItem>
							<SelectItem value="room">{t('resource.types.room')}</SelectItem>
							<SelectItem value="booth">{t('resource.types.booth')}</SelectItem>
							<SelectItem value="activity">
								{t('resource.types.activity')}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label>
						{t('resource.defaultDuration')} ({t('minutes')})
					</Label>
					<Input
						type="number"
						disabled={disabled}
						value={form.defaultDurationMinutes}
						onChange={(e) =>
							setForm({
								...form,
								defaultDurationMinutes: +e.target.value,
							})
						}
					/>
				</div>

				<div className="space-y-1">
					<Label>
						{form.type === 'activity'
							? `${t('resource.capacity')}`
							: `${t('resource.maxConcurrent')}`}
					</Label>

					{form.type === 'activity' ? (
						<Input
							type="number"
							disabled={disabled}
							value={form.capacity ?? ''}
							onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
						/>
					) : (
						<Input
							type="number"
							disabled={disabled}
							value={form.maxConcurrent}
							onChange={(e) =>
								setForm({
									...form,
									maxConcurrent: +e.target.value,
								})
							}
						/>
					)}
				</div>

				<div className="space-y-1">
					<Label>{t('status')}</Label>
					<div className="flex items-center gap-2 h-10">
						<Switch
							checked={form.isActive}
							disabled={disabled}
							onCheckedChange={(v) => setForm({ ...form, isActive: v })}
						/>
						<span className="text-sm">Active</span>
					</div>
				</div>
			</div>

			{/* Text areas */}
			<div className="space-y-1">
				<Label>{t('description')}</Label>
				<Textarea
					disabled={disabled}
					value={form.description ?? ''}
					onChange={(e) => setForm({ ...form, description: e.target.value })}
				/>
			</div>

			<div className="space-y-1">
				<Label>{t('resource.requiredItems')}</Label>
				<Textarea
					disabled={disabled}
					value={form.requiredItems ?? ''}
					onChange={(e) => setForm({ ...form, requiredItems: e.target.value })}
				/>
			</div>

			<div className="space-y-1">
				<Label>{t('resource.preparation')}</Label>
				<Textarea
					disabled={disabled}
					value={form.prep ?? ''}
					onChange={(e) => setForm({ ...form, prep: e.target.value })}
				/>
			</div>

			<div className="space-y-1">
				<Label>{t('notes')}</Label>
				<Textarea
					disabled={disabled}
					value={form.notes ?? ''}
					onChange={(e) => setForm({ ...form, notes: e.target.value })}
				/>
			</div>

			<div className="space-y-1">
				<Label>{t('link')}</Label>
				<Input
					disabled={disabled}
					value={form.link ?? ''}
					onChange={(e) => setForm({ ...form, link: e.target.value })}
				/>
			</div>

			{/* Actions */}
			{mode === 'read' && resourceId && locale && (
				<div className="flex gap-2">
					<Link href={`/${locale}/admin/resource/update/${resourceId}`}>
						<Button>{t('edit')}</Button>
					</Link>

					<Link href={`/${locale}/admin/resource/delete/${resourceId}`}>
						<Button variant="destructive">{t('delete')}</Button>
					</Link>
				</div>
			)}

			{/* Submit */}
			{mode !== 'read' && (
				<Button
					variant={mode === 'delete' ? 'destructive' : 'default'}
					onClick={submit}
					disabled={pending}
				>
					{pending
						? 'Working…'
						: mode === 'delete'
						? `${t('delete')} ${t('resource.title')}`
						: mode === 'update'
						? `${t('update')} ${t('resource.title')}`
						: `${t('create')} ${t('resource.title')}`}
				</Button>
			)}
		</Card>
	)
}
