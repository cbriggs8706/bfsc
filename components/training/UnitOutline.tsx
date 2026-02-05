'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { UserCourse } from '@/types/training'

export function UnitOutline({
	units,
	activeUnitId,
	onPickUnit,
	locale,
}: {
	units: UserCourse['units']
	activeUnitId: string
	onPickUnit: (id: string) => void
	locale: string
}) {
	return (
		<Card className="p-3">
			<div className="flex items-center justify-between">
				<div className="font-medium">Course outline</div>
				<Badge variant="secondary">{units.length} units</Badge>
			</div>

			{/* Mobile: accordion */}
			<div className="mt-3">
				<Accordion
					type="single"
					collapsible
					defaultValue={activeUnitId || undefined}
				>
					{units.map((unit) => (
						<AccordionItem key={unit.id} value={unit.id}>
							<AccordionTrigger onClick={() => onPickUnit(unit.id)}>
								{unit.title}
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-1">
									{unit.lessons.map((lesson) => (
										<Link
											key={lesson.id}
											href={`/${locale}/training/lessons/${lesson.id}`}
											className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
										>
											<span className="flex items-center gap-2 min-w-0">
												{lesson.isCompleted ? (
													<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
												) : (
													<Circle className="h-4 w-4 text-muted-foreground shrink-0" />
												)}
												<span
													className={`truncate ${
														lesson.isCompleted
															? 'line-through text-muted-foreground'
															: ''
													}`}
												>
													{lesson.title}
												</span>
											</span>
											{lesson.isCompleted ? (
												<span className="text-xs text-muted-foreground shrink-0">
													Completed
												</span>
											) : (
												<span className="text-xs font-medium text-foreground shrink-0">
													Begin
												</span>
											)}
										</Link>
									))}

									{unit.lessons.length === 0 ? (
										<div className="px-2 py-2 text-sm text-muted-foreground">
											No lessons yet.
										</div>
									) : null}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</Card>
	)
}
