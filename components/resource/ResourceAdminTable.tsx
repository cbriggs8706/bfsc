// components/resources/ResourceAdminTable.tsx
'use client'

import { Resource } from '@/types/resource'
import { updateResource } from '@/app/actions/resources/update-resource'
import { deactivateResource } from '@/app/actions/resources/deactivate-resource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Card } from '../ui/card'

type Props = {
	resources: Resource[]
	onChange: (resources: Resource[]) => void
}

const TYPE_LABELS: Record<Resource['type'], string> = {
	equipment: 'Equipment',
	room: 'Rooms',
	booth: 'Recording Booths',
	activity: 'Activities',
}

function groupByType(
	resources: Resource[]
): Record<Resource['type'], Resource[]> {
	return resources.reduce((acc, r) => {
		;(acc[r.type] ??= []).push(r)

		return acc
	}, {} as Record<Resource['type'], Resource[]>)
}

export function ResourceAdminTable({ resources, onChange }: Props) {
	const grouped = groupByType(resources)

	return (
		<div className="space-y-8">
			{(Object.keys(TYPE_LABELS) as Resource['type'][]).map((type) => {
				const items = grouped[type]
				if (!items || items.length === 0) return null

				return (
					<section key={type} className="space-y-3">
						<h2 className="text-lg font-semibold">{TYPE_LABELS[type]}</h2>
						<p className="text-sm text-muted-foreground">
							{type === 'activity'
								? 'Capacity-based reservations'
								: 'Time-based reservations'}
						</p>
						<Card className="p-4">
							{items.map((r) => (
								<div
									key={r.id}
									className="flex flex-col lg:flex-row gap-1 rounded-2xl p-4 lg:p-0 border lg:border-0"
								>
									<Input
										value={r.name}
										onChange={(e) =>
											onChange(
												resources.map((x) =>
													x.id === r.id ? { ...x, name: e.target.value } : x
												)
											)
										}
									/>

									{r.type === 'activity' && (
										<Input
											type="number"
											placeholder="Capacity"
											value={r.capacity ?? ''}
											onChange={(e) =>
												onChange(
													resources.map((x) =>
														x.id === r.id
															? {
																	...x,
																	capacity: Number(e.target.value) || null,
															  }
															: x
													)
												)
											}
										/>
									)}

									<Select
										value={r.type}
										onValueChange={(value) =>
											onChange(
												resources.map((x) =>
													x.id === r.id
														? { ...x, type: value as Resource['type'] }
														: x
												)
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="equipment">Equipment</SelectItem>
											<SelectItem value="room">Room</SelectItem>
											<SelectItem value="booth">Recording Booth</SelectItem>
											<SelectItem value="activity">Activity</SelectItem>
										</SelectContent>
									</Select>

									<Input
										type="number"
										value={r.defaultDurationMinutes}
										onChange={(e) =>
											onChange(
												resources.map((x) =>
													x.id === r.id
														? {
																...x,
																defaultDurationMinutes: Number(e.target.value),
														  }
														: x
												)
											)
										}
									/>

									<Input
										type="number"
										value={r.maxConcurrent}
										onChange={(e) =>
											onChange(
												resources.map((x) =>
													x.id === r.id
														? {
																...x,
																maxConcurrent: Number(e.target.value),
														  }
														: x
												)
											)
										}
									/>

									<div className="flex gap-1 my-auto">
										<Button
											onClick={() => updateResource({ ...r, isActive: true })}
											size="sm"
										>
											Save
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => deactivateResource(r.id)}
										>
											Deactivate
										</Button>
									</div>
								</div>
							))}
						</Card>
					</section>
				)
			})}
		</div>
	)
}
