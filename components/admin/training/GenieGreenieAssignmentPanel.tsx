'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

type AvailableMicroskill = {
	id: number
	name: string
	slug: string
	status: 'not_started' | 'in_progress' | 'active' | 'renewal_required'
	category: string
	skillLevel: string
	version: number
	description: string
}

type Props = {
	locale: string
}

const statusCopy: Record<AvailableMicroskill['status'], string> = {
	not_started: 'Not started',
	in_progress: 'In progress',
	active: 'Active',
	renewal_required: 'Renewal required',
}

export function GenieGreenieAssignmentPanel({ locale }: Props) {
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [query, setQuery] = useState('')
	const [microskills, setMicroskills] = useState<AvailableMicroskill[]>([])
	const [selected, setSelected] = useState<Set<number>>(new Set())

	const filteredMicroskills = useMemo(() => {
		const needle = query.trim().toLowerCase()
		if (!needle) return microskills

		return microskills.filter(
			(item) =>
				item.name.toLowerCase().includes(needle) ||
				item.slug.toLowerCase().includes(needle) ||
				item.category.toLowerCase().includes(needle)
		)
	}, [microskills, query])

	async function loadCatalog() {
		setLoading(true)
		try {
			const res = await fetch('/api/admin/training/genie-greenie', {
				cache: 'no-store',
			})
			const payload = (await res.json()) as {
				error?: string
				microskills?: AvailableMicroskill[]
				assignedMicroskillIds?: number[]
			}

			if (!res.ok || !payload.microskills) {
				throw new Error(payload.error ?? 'Unable to load Genie Greenie courses')
			}

			setMicroskills(payload.microskills)
			setSelected(new Set(payload.assignedMicroskillIds ?? []))
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Unable to load Genie Greenie courses'
			)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadCatalog()
	}, [])

	async function saveAssignedCourses() {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/training/genie-greenie', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					microskillIds: Array.from(selected),
				}),
			})

			const payload = (await res.json()) as { error?: string }
			if (!res.ok) {
				throw new Error(payload.error ?? 'Unable to save course assignments')
			}

			toast.success('Assigned Genie Greenie courses updated for all consultants')
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Unable to save course assignments'
			)
		} finally {
			setSaving(false)
		}
	}

	function toggleMicroskill(id: number, checked: boolean) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (checked) next.add(id)
			else next.delete(id)
			return next
		})
	}

	function selectAllVisible() {
		setSelected((prev) => {
			const next = new Set(prev)
			for (const item of filteredMicroskills) next.add(item.id)
			return next
		})
	}

	function clearSelection() {
		setSelected(new Set())
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<CardTitle className="text-2xl">Training Admin</CardTitle>
						<CardDescription>
							Select Genie Greenie courses to assign to all consultants.
						</CardDescription>
					</div>
					<Button asChild variant="secondary">
						<Link href={`/${locale}/admin/training/courses`}>
							Manage custom courses
						</Link>
					</Button>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Available Genie Greenie courses</CardTitle>
					<CardDescription>
						Assigned courses appear in each consultant&apos;s training page with
						their own progress.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="text-sm font-medium">Filter courses</div>
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search by name, slug, or category"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline" onClick={loadCatalog} disabled={loading}>
							{loading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="mr-2 h-4 w-4" />
							)}
							Refresh
						</Button>
						<Button
							variant="outline"
							onClick={selectAllVisible}
							disabled={filteredMicroskills.length === 0}
						>
							Select visible
						</Button>
						<Button
							variant="outline"
							onClick={clearSelection}
							disabled={selected.size === 0}
						>
							Clear
						</Button>
						<Button onClick={saveAssignedCourses} disabled={saving}>
							{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Save assignment ({selected.size})
						</Button>
					</div>

					{loading ? (
						<div className="rounded-md border p-6 text-sm text-muted-foreground">
							Loading Genie Greenie courses...
						</div>
					) : filteredMicroskills.length ? (
						<div className="grid gap-2">
							{filteredMicroskills.map((item) => {
								const checked = selected.has(item.id)
								return (
									<label
										key={item.id}
										className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
									>
										<Checkbox
											checked={checked}
											onCheckedChange={(v) => toggleMicroskill(item.id, Boolean(v))}
											className="mt-1"
										/>
										<div className="min-w-0 space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium">{item.name}</span>
												<span className="text-xs text-muted-foreground">
													{item.skillLevel}
												</span>
												<span className="text-xs text-muted-foreground">
													{statusCopy[item.status]}
												</span>
											</div>
											<div className="text-xs text-muted-foreground">
												{item.slug} • {item.category} • v{item.version}
											</div>
											{item.description ? (
												<p className="text-sm text-muted-foreground">
													{item.description}
												</p>
											) : null}
										</div>
									</label>
								)
							})}
						</div>
					) : (
						<div className="rounded-md border p-6 text-sm text-muted-foreground">
							No Genie Greenie courses found.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
