// components/classes/ClassSeriesForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

import { CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

import type {
	PresenterOption,
	SeriesUpsertInput,
	UISeriesWithSessions,
} from '@/db/queries/classes'

// TODO: implement these like your uploadAnnouncementImage
import { uploadClassCoverImage } from '@/utils/upload-class-cover-image'
import { uploadClassHandoutPdf } from '@/utils/upload-class-handout-pdf'
import { PresenterMultiSelect } from '../custom/WorkerMultiSelect'

type Mode = 'create' | 'update'

type Props =
	| {
			mode: 'create'
			initial?: undefined
			locale: string
			requireApproval: boolean
			canApprove: boolean
			presenterOptions: PresenterOption[]
			onSubmit: (input: SeriesUpsertInput) => Promise<void>
			onDoneHref: string
	  }
	| {
			mode: 'update'
			initial: UISeriesWithSessions
			locale: string
			requireApproval: boolean
			canApprove: boolean
			presenterOptions: PresenterOption[]
			onSubmit: (input: SeriesUpsertInput) => Promise<void>
			onDoneHref: string
	  }

function isSeriesStatus(value: unknown): value is 'draft' | 'published' {
	return value === 'draft' || value === 'published'
}

function toLocalDateTimeValue(d: Date) {
	// datetime-local expects "YYYY-MM-DDTHH:mm"
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours()
	)}:${pad(d.getMinutes())}`
}

function localInputToUtcIso(value: string) {
	// value is interpreted as local time by Date()
	const dt = new Date(value)
	return dt.toISOString()
}

type LinkDraft = { id?: string; label: string; url: string }
type HandoutDraft = {
	id?: string
	fileName: string
	filePath: string
	publicUrl: string | null
}

type SessionDraft = {
	id?: string
	partNumber: number
	startsAtLocal: string // datetime-local
	durationHours: number
	durationMinutes: number
	status: 'scheduled' | 'canceled'
	canceledReason: string

	// overrides
	overrideOn: boolean
	titleOverride: string
	descriptionOverride: string
	locationOverride: string
	zoomUrlOverride: string
	recordingUrlOverride: string

	// per-session presenter override
	overridePresenters: boolean
	presenterIds: string[]

	// per-session link override
	overrideLinks: boolean
	links: LinkDraft[]

	handouts: HandoutDraft[]
}

export function ClassSeriesForm(props: Props) {
	const router = useRouter()

	const isUpdate = props.mode === 'update'

	const initialSeries = isUpdate ? props.initial.series : null
	const initialSessions = isUpdate ? props.initial.sessions : []

	const [title, setTitle] = useState(initialSeries?.title ?? '')
	const [description, setDescription] = useState(
		initialSeries?.description ?? ''
	)
	const [location, setLocation] = useState(initialSeries?.location ?? '')
	const [zoomUrl, setZoomUrl] = useState(initialSeries?.zoomUrl ?? '')
	const [recordingUrl, setRecordingUrl] = useState(
		initialSeries?.recordingUrl ?? ''
	)

	const [status, setStatus] = useState<'draft' | 'published'>(
		isSeriesStatus(initialSeries?.status)
			? initialSeries.status
			: props.requireApproval
			? 'draft'
			: 'published'
	)

	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
		initialSeries?.coverImageUrl ?? null
	)
	const [coverImagePath, setCoverImagePath] = useState<string | null>(
		initialSeries?.coverImagePath ?? null
	)

	const [seriesPresenterIds, setSeriesPresenterIds] = useState<string[]>(
		initialSeries?.presenterIds ?? []
	)

	const [seriesLinks, setSeriesLinks] = useState<LinkDraft[]>(
		initialSeries?.links ?? []
	)

	// one-time vs series: one-time = exactly 1 session
	const [isSeries, setIsSeries] = useState<boolean>(initialSessions.length > 1)

	const defaultStart = useMemo(() => toLocalDateTimeValue(new Date()), [])
	const [sessions, setSessions] = useState<SessionDraft[]>(() => {
		if (!isUpdate) {
			return [
				{
					partNumber: 1,
					startsAtLocal: defaultStart,
					durationHours: 1,
					durationMinutes: 0,
					status: 'scheduled',
					canceledReason: '',
					overrideOn: false,
					titleOverride: '',
					descriptionOverride: '',
					locationOverride: '',
					zoomUrlOverride: '',
					recordingUrlOverride: '',
					overridePresenters: false,
					presenterIds: [],
					overrideLinks: false,
					links: [],
					handouts: [],
				},
			]
		}

		return initialSessions.map((s) => {
			const startsAtLocal = toLocalDateTimeValue(new Date(s.startsAt))
			const hours = Math.floor(s.durationMinutes / 60)
			const mins = s.durationMinutes % 60

			return {
				id: s.id,
				partNumber: s.partNumber,
				startsAtLocal,
				durationHours: hours,
				durationMinutes: mins,
				status: s.status === 'canceled' ? 'canceled' : 'scheduled',
				canceledReason: s.canceledReason ?? '',
				overrideOn: Boolean(
					s.titleOverride ||
						s.descriptionOverride ||
						s.locationOverride ||
						s.zoomUrlOverride ||
						s.recordingUrlOverride
				),
				titleOverride: s.titleOverride ?? '',
				descriptionOverride: s.descriptionOverride ?? '',
				locationOverride: s.locationOverride ?? '',
				zoomUrlOverride: s.zoomUrlOverride ?? '',
				recordingUrlOverride: s.recordingUrlOverride ?? '',
				overridePresenters: (s.presenterIds?.length ?? 0) > 0,
				presenterIds: s.presenterIds ?? [],
				overrideLinks: (s.links?.length ?? 0) > 0,
				links: s.links ?? [],
				handouts: s.handouts ?? [],
			}
		})
	})

	const [deletedSessionIds, setDeletedSessionIds] = useState<string[]>([])
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)

	const toggleSeriesPresenter = (id: string) => {
		setSeriesPresenterIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	const addSeriesLink = () =>
		setSeriesLinks((p) => [...p, { label: '', url: '' }])
	const removeSeriesLink = (idx: number) =>
		setSeriesLinks((p) => p.filter((_, i) => i !== idx))

	const addSession = () => {
		setSessions((prev) => {
			const nextPart = prev.length
				? Math.max(...prev.map((s) => s.partNumber)) + 1
				: 1
			return [
				...prev,
				{
					partNumber: nextPart,
					startsAtLocal: defaultStart,
					durationHours: 1,
					durationMinutes: 0,
					status: 'scheduled',
					canceledReason: '',
					overrideOn: false,
					titleOverride: '',
					descriptionOverride: '',
					locationOverride: '',
					zoomUrlOverride: '',
					recordingUrlOverride: '',
					overridePresenters: false,
					presenterIds: [],
					overrideLinks: false,
					links: [],
					handouts: [],
				},
			]
		})
	}

	const removeSession = (idx: number) => {
		setSessions((prev) => {
			const target = prev[idx]
			if (target?.id) setDeletedSessionIds((d) => [...d, target.id!])
			return prev.filter((_, i) => i !== idx)
		})
	}

	const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const res = await uploadClassCoverImage(file) // { publicUrl, filePath }
			setCoverImageUrl(res.publicUrl)
			setCoverImagePath(res.filePath)
			toast.success('Cover uploaded')
		} catch (err) {
			console.error(err)
			toast.error('Cover upload failed')
		} finally {
			setUploading(false)
		}
	}

	const handleHandoutUpload = async (sessionIdx: number, file: File) => {
		setUploading(true)
		try {
			const res = await uploadClassHandoutPdf(file) // { publicUrl, filePath, fileName }
			setSessions((prev) =>
				prev.map((s, i) =>
					i === sessionIdx
						? {
								...s,
								handouts: [
									...s.handouts,
									{
										fileName: res.fileName,
										filePath: res.filePath,
										publicUrl: res.publicUrl ?? null,
									},
								],
						  }
						: s
				)
			)
			toast.success('Handout uploaded')
		} catch (err) {
			console.error(err)
			toast.error('Handout upload failed')
		} finally {
			setUploading(false)
		}
	}

	const submit = async () => {
		if (!title.trim()) return toast.error('Title is required.')
		if (!location.trim()) return toast.error('Location is required.')
		if (seriesPresenterIds.length === 0)
			return toast.error('Select at least one presenter.')

		const normalizedSessions = (isSeries ? sessions : sessions.slice(0, 1)).map(
			(s) => {
				const durationMinutes = s.durationHours * 60 + s.durationMinutes

				return {
					id: s.id,
					partNumber: s.partNumber,
					startsAt: localInputToUtcIso(s.startsAtLocal),
					durationMinutes,
					status: s.status,
					canceledReason:
						s.status === 'canceled' ? s.canceledReason.trim() || null : null,

					titleOverride: s.overrideOn ? s.titleOverride.trim() || null : null,
					descriptionOverride: s.overrideOn
						? s.descriptionOverride.trim() || null
						: null,
					locationOverride: s.overrideOn
						? s.locationOverride.trim() || null
						: null,
					zoomUrlOverride: s.overrideOn
						? s.zoomUrlOverride.trim() || null
						: null,
					recordingUrlOverride: s.overrideOn
						? s.recordingUrlOverride.trim() || null
						: null,

					presenterIds: s.overridePresenters ? s.presenterIds : [],
					links: s.overrideLinks
						? s.links
								.filter((l) => l.label.trim() && l.url.trim())
								.map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
						: [],
					handouts: s.handouts,
				}
			}
		)

		const input: SeriesUpsertInput = {
			title: title.trim(),
			description: description.trim() ? description.trim() : null,
			location: location.trim(),
			zoomUrl: zoomUrl.trim() ? zoomUrl.trim() : null,
			recordingUrl: recordingUrl.trim() ? recordingUrl.trim() : null,
			coverImageUrl,
			coverImagePath,

			status: props.canApprove ? status : undefined,

			presenterIds: seriesPresenterIds,
			links: seriesLinks
				.filter((l) => l.label.trim() && l.url.trim())
				.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),

			sessions: normalizedSessions,
			deletedSessionIds: deletedSessionIds.length
				? deletedSessionIds
				: undefined,
		}

		setSaving(true)
		try {
			await props.onSubmit(input)
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
		<CardContent className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-medium">Series</div>
					<div className="text-xs text-muted-foreground">
						If off, this will create only one session.
					</div>
				</div>
				<Switch checked={isSeries} onCheckedChange={setIsSeries} />
			</div>

			<div className="space-y-2">
				<Label>Title</Label>
				<Input value={title} onChange={(e) => setTitle(e.target.value)} />
			</div>

			<div className="space-y-2">
				<Label>Description (optional)</Label>
				<Textarea
					value={description}
					rows={4}
					onChange={(e) => setDescription(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Location</Label>
				<Input value={location} onChange={(e) => setLocation(e.target.value)} />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Zoom Link (optional)</Label>
					<Input value={zoomUrl} onChange={(e) => setZoomUrl(e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label>Recording Link (optional)</Label>
					<Input
						value={recordingUrl}
						onChange={(e) => setRecordingUrl(e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Cover Image (optional)</Label>
				<Input
					type="file"
					accept="image/*"
					disabled={uploading}
					onChange={handleCoverUpload}
				/>
				{coverImageUrl && (
					<p className="text-xs text-muted-foreground break-all">
						Current: {coverImageUrl}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label>Presenters</Label>

				<PresenterMultiSelect
					options={props.presenterOptions}
					value={seriesPresenterIds}
					onChange={setSeriesPresenterIds}
				/>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>Series Links (optional)</Label>
					<Button
						variant="secondary"
						size="sm"
						type="button"
						onClick={addSeriesLink}
					>
						Add link
					</Button>
				</div>

				<div className="space-y-2">
					{seriesLinks.map((l, idx) => (
						<div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
							<Input
								className="sm:col-span-2"
								placeholder="Label"
								value={l.label}
								onChange={(e) =>
									setSeriesLinks((p) =>
										p.map((x, i) =>
											i === idx ? { ...x, label: e.target.value } : x
										)
									)
								}
							/>
							<Input
								className="sm:col-span-2"
								placeholder="https://..."
								value={l.url}
								onChange={(e) =>
									setSeriesLinks((p) =>
										p.map((x, i) =>
											i === idx ? { ...x, url: e.target.value } : x
										)
									)
								}
							/>
							<Button
								type="button"
								variant="destructive"
								onClick={() => removeSeriesLink(idx)}
							>
								Remove
							</Button>
						</div>
					))}
				</div>
			</div>

			{props.canApprove && props.requireApproval && (
				<div className="flex items-center justify-between border rounded-md p-3">
					<div>
						<div className="text-sm font-medium">Publishing</div>
						<div className="text-xs text-muted-foreground">
							Approval is enabled. Drafts aren’t public until published.
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">{status}</span>
						<Switch
							checked={status === 'published'}
							onCheckedChange={(v) => setStatus(v ? 'published' : 'draft')}
						/>
					</div>
				</div>
			)}

			<Separator />

			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-medium">Parts / Sessions</div>
					<div className="text-xs text-muted-foreground">
						Canceled sessions stay visible on the calendar.
					</div>
				</div>
				{isSeries && (
					<Button type="button" variant="secondary" onClick={addSession}>
						Add part
					</Button>
				)}
			</div>

			<div className="space-y-4">
				{(isSeries ? sessions : sessions.slice(0, 1)).map((s, idx) => (
					<div key={s.id ?? idx} className="border rounded-md p-3 space-y-3">
						<div className="flex items-center justify-between">
							<div className="font-medium">Part {s.partNumber}</div>
							{isSeries && (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => removeSession(idx)}
								>
									Remove
								</Button>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-2">
								<Label>Start</Label>
								<Input
									type="datetime-local"
									value={s.startsAtLocal}
									onChange={(e) =>
										setSessions((p) =>
											p.map((x, i) =>
												i === idx ? { ...x, startsAtLocal: e.target.value } : x
											)
										)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Duration (hours)</Label>
								<Input
									type="number"
									min={0}
									value={s.durationHours}
									onChange={(e) =>
										setSessions((p) =>
											p.map((x, i) =>
												i === idx
													? { ...x, durationHours: Number(e.target.value || 0) }
													: x
											)
										)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Duration (minutes)</Label>
								<Input
									type="number"
									min={0}
									max={59}
									value={s.durationMinutes}
									onChange={(e) =>
										setSessions((p) =>
											p.map((x, i) =>
												i === idx
													? {
															...x,
															durationMinutes: Number(e.target.value || 0),
													  }
													: x
											)
										)
									}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="text-sm font-medium">Canceled</div>
							<Switch
								checked={s.status === 'canceled'}
								onCheckedChange={(v) =>
									setSessions((p) =>
										p.map((x, i) =>
											i === idx
												? { ...x, status: v ? 'canceled' : 'scheduled' }
												: x
										)
									)
								}
							/>
						</div>

						{s.status === 'canceled' && (
							<div className="space-y-2">
								<Label>Cancellation Reason (optional)</Label>
								<Input
									value={s.canceledReason}
									onChange={(e) =>
										setSessions((p) =>
											p.map((x, i) =>
												i === idx ? { ...x, canceledReason: e.target.value } : x
											)
										)
									}
								/>
							</div>
						)}

						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm font-medium">
									Override title/desc/location/links
								</div>
								<div className="text-xs text-muted-foreground">
									If off, this part inherits from the series.
								</div>
							</div>
							<Switch
								checked={s.overrideOn}
								onCheckedChange={(v) =>
									setSessions((p) =>
										p.map((x, i) => (i === idx ? { ...x, overrideOn: v } : x))
									)
								}
							/>
						</div>

						{s.overrideOn && (
							<div className="space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label>Title override</Label>
										<Input
											value={s.titleOverride}
											onChange={(e) =>
												setSessions((p) =>
													p.map((x, i) =>
														i === idx
															? { ...x, titleOverride: e.target.value }
															: x
													)
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Location override</Label>
										<Input
											value={s.locationOverride}
											onChange={(e) =>
												setSessions((p) =>
													p.map((x, i) =>
														i === idx
															? { ...x, locationOverride: e.target.value }
															: x
													)
												)
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Description override</Label>
									<Textarea
										rows={3}
										value={s.descriptionOverride}
										onChange={(e) =>
											setSessions((p) =>
												p.map((x, i) =>
													i === idx
														? { ...x, descriptionOverride: e.target.value }
														: x
												)
											)
										}
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label>Zoom override</Label>
										<Input
											value={s.zoomUrlOverride}
											onChange={(e) =>
												setSessions((p) =>
													p.map((x, i) =>
														i === idx
															? { ...x, zoomUrlOverride: e.target.value }
															: x
													)
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Recording override</Label>
										<Input
											value={s.recordingUrlOverride}
											onChange={(e) =>
												setSessions((p) =>
													p.map((x, i) =>
														i === idx
															? { ...x, recordingUrlOverride: e.target.value }
															: x
													)
												)
											}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="text-sm font-medium">Override presenters</div>
									<Switch
										checked={s.overridePresenters}
										onCheckedChange={(v) =>
											setSessions((p) =>
												p.map((x, i) =>
													i === idx ? { ...x, overridePresenters: v } : x
												)
											)
										}
									/>
								</div>

								{s.overridePresenters && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{props.presenterOptions.map((p) => {
											const checked = s.presenterIds.includes(p.id)
											return (
												<label
													key={p.id}
													className="flex items-center justify-between p-2 border rounded-md"
												>
													<span className="text-sm">{p.name ?? p.email}</span>
													<Switch
														checked={checked}
														onCheckedChange={() =>
															setSessions((prev) =>
																prev.map((x, i) => {
																	if (i !== idx) return x
																	return {
																		...x,
																		presenterIds: checked
																			? x.presenterIds.filter(
																					(id) => id !== p.id
																			  )
																			: [...x.presenterIds, p.id],
																	}
																})
															)
														}
													/>
												</label>
											)
										})}
									</div>
								)}

								<div className="flex items-center justify-between">
									<div className="text-sm font-medium">Override links</div>
									<Switch
										checked={s.overrideLinks}
										onCheckedChange={(v) =>
											setSessions((p) =>
												p.map((x, i) =>
													i === idx ? { ...x, overrideLinks: v } : x
												)
											)
										}
									/>
								</div>

								{s.overrideLinks && (
									<div className="space-y-2">
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() =>
												setSessions((p) =>
													p.map((x, i) =>
														i === idx
															? {
																	...x,
																	links: [...x.links, { label: '', url: '' }],
															  }
															: x
													)
												)
											}
										>
											Add link
										</Button>

										{s.links.map((l, linkIdx) => (
											<div
												key={linkIdx}
												className="grid grid-cols-1 sm:grid-cols-5 gap-2"
											>
												<Input
													className="sm:col-span-2"
													placeholder="Label"
													value={l.label}
													onChange={(e) =>
														setSessions((p) =>
															p.map((x, i) => {
																if (i !== idx) return x
																return {
																	...x,
																	links: x.links.map((ll, j) =>
																		j === linkIdx
																			? { ...ll, label: e.target.value }
																			: ll
																	),
																}
															})
														)
													}
												/>
												<Input
													className="sm:col-span-2"
													placeholder="https://..."
													value={l.url}
													onChange={(e) =>
														setSessions((p) =>
															p.map((x, i) => {
																if (i !== idx) return x
																return {
																	...x,
																	links: x.links.map((ll, j) =>
																		j === linkIdx
																			? { ...ll, url: e.target.value }
																			: ll
																	),
																}
															})
														)
													}
												/>
												<Button
													type="button"
													variant="destructive"
													onClick={() =>
														setSessions((p) =>
															p.map((x, i) => {
																if (i !== idx) return x
																return {
																	...x,
																	links: x.links.filter(
																		(_, j) => j !== linkIdx
																	),
																}
															})
														)
													}
												>
													Remove
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						<div className="space-y-2">
							<Label>Handouts (PDF)</Label>
							<Input
								type="file"
								accept="application/pdf"
								disabled={uploading}
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) void handleHandoutUpload(idx, file)
								}}
							/>
							{s.handouts.length > 0 && (
								<ul className="text-sm list-disc pl-5">
									{s.handouts.map((h, hi) => (
										<li
											key={hi}
											className="flex items-center justify-between gap-2"
										>
											<span className="truncate">{h.fileName}</span>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() =>
													setSessions((p) =>
														p.map((x, i) =>
															i === idx
																? {
																		...x,
																		handouts: x.handouts.filter(
																			(_, j) => j !== hi
																		),
																  }
																: x
														)
													)
												}
											>
												Remove
											</Button>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				))}
			</div>

			<div className="space-y-2">
				<Button
					className="w-full"
					onClick={submit}
					disabled={saving || uploading}
				>
					{saving ? 'Saving…' : 'Save'}
				</Button>

				<Button className="w-full" variant="secondary" asChild>
					<Link href={props.onDoneHref}>Cancel</Link>
				</Button>
			</div>
		</CardContent>
	)
}
