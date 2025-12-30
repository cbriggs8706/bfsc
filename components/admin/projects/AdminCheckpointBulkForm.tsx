'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveProjectCheckpointsBulk } from '@/lib/actions/projects/add-checkpoints'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

type ParsedRow = {
	name: string
	notes: string
	url: string
	estimatedDuration: string
}

type Props = {
	projectId: string
	locale: string
}

export function AdminCheckpointBulkForm({ projectId, locale }: Props) {
	const router = useRouter()
	const [raw, setRaw] = useState('')
	const [mode, setMode] = useState<'append' | 'replace'>('append')
	const [isPending, startTransition] = useTransition()

	/* ------------------------------------------------------------------
	   TSV parsing (Excel & Sheets safe)
	------------------------------------------------------------------ */
	const parsedRows = useMemo<ParsedRow[]>(() => {
		if (!raw.trim()) return []

		return raw
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const parts = line.split('\t')

				return {
					name: parts[0]?.trim() ?? '',
					url: parts[1]?.trim() ?? '',
					notes: parts[2]?.trim() ?? '',
					estimatedDuration: parts[3]?.trim() ?? '1',
				}
			})
			.filter((r) => r.name)
	}, [raw])

	const onSave = () => {
		startTransition(async () => {
			const res = await saveProjectCheckpointsBulk(locale, projectId, {
				mode,
				rows: parsedRows,
			})

			if (res.ok) {
				setRaw('')
				router.refresh()
			}
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Bulk Add Checkpoints</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="space-y-1">
					<Label>Paste from Google Sheets / Excel</Label>
					<Textarea
						rows={8}
						placeholder="Name[TAB]URL[TAB]Notes[TAB]Estimated Duration"
						value={raw}
						onChange={(e) => setRaw(e.target.value)}
						disabled={isPending}
					/>
					<p className="text-xs text-muted-foreground">
						Columns must be tab-separated. Extra columns are ignored.
					</p>
				</div>

				<RadioGroup
					value={mode}
					onValueChange={(v) => setMode(v as 'append' | 'replace')}
					className="flex gap-4"
				>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="append" id="append" />
						<Label htmlFor="append">Append</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="replace" id="replace" />
						<Label htmlFor="replace">Replace all existing</Label>
					</div>
				</RadioGroup>

				<div>
					<div className="text-sm font-medium mb-1">
						Preview ({parsedRows.length})
					</div>

					<div className="max-h-48 overflow-auto border rounded">
						<table className="w-full text-sm">
							<tbody>
								{parsedRows.map((r, i) => (
									<tr key={i} className="border-b last:border-0">
										<td className="p-2">{r.name}</td>
										<td className="p-2 text-muted-foreground">{r.url}</td>
										<td className="p-2 text-muted-foreground">{r.notes}</td>
										<td className="p-2 text-muted-foreground">
											{r.estimatedDuration}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<Button
					onClick={onSave}
					disabled={isPending || parsedRows.length === 0}
				>
					Save Checkpoints
				</Button>
			</CardContent>
		</Card>
	)
}
