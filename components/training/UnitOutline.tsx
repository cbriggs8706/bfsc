'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
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
			<div className="mt-3 lg:hidden">
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
											className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
										>
											<span className="truncate">{lesson.title}</span>
											{lesson.isCompleted ? (
												<CheckCircle2 className="h-4 w-4" />
											) : null}
										</Link>
									))}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>

			{/* Desktop: list */}
			<div className="mt-3 hidden lg:block">
				<div className="space-y-2">
					{units.map((unit) => {
						const completed = unit.lessons.filter((l) => l.isCompleted).length
						const total = unit.lessons.length
						const isActive = unit.id === activeUnitId

						return (
							<button
								key={unit.id}
								onClick={() => onPickUnit(unit.id)}
								className={`w-full rounded-md border px-3 py-2 text-left transition ${
									isActive ? 'bg-muted border-foreground/20' : 'hover:bg-muted'
								}`}
							>
								<div className="font-medium">{unit.title}</div>
								<div className="text-xs text-muted-foreground">
									{completed}/{total} lessons completed
								</div>
							</button>
						)
					})}
				</div>
			</div>
		</Card>
	)
}
