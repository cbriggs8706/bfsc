'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	createUnit,
	deleteUnit,
	createLesson,
	deleteLesson,
} from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { AdminUnit } from '@/types/training'

export function UnitsOutline(props: {
	courseId: string
	units: AdminUnit[]
	selection: { kind: string; unitId: string; lessonId: string }
	onSelect: (s: { kind: string; unitId: string; lessonId: string }) => void
}) {
	const { courseId, units, selection, onSelect } = props
	const router = useRouter()

	const [unitTitle, setUnitTitle] = useState('')

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<div className="text-sm font-medium">Units</div>

				<div className="flex gap-2">
					<Input
						value={unitTitle}
						onChange={(e) => setUnitTitle(e.target.value)}
						placeholder="New unit title"
					/>
					<Button
						type="button"
						disabled={!unitTitle.trim()}
						onClick={async () => {
							await createUnit({ courseId, title: unitTitle.trim() })
							setUnitTitle('')
							router.refresh()
						}}
					>
						Add
					</Button>
				</div>
			</div>

			<Separator />

			<Accordion type="multiple" className="w-full">
				{units.map((unit) => {
					const unitActive =
						selection.kind === 'unit' && selection.unitId === unit.id

					return (
						<AccordionItem key={unit.id} value={unit.id}>
							<div className="flex items-center justify-between gap-2">
								<AccordionTrigger
									onClick={() =>
										onSelect({
											kind: 'unit',
											unitId: unit.id,
											lessonId: '',
										})
									}
									className={unitActive ? 'font-semibold' : ''}
								>
									{unit.title}
								</AccordionTrigger>

								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="text-destructive"
									onClick={async (e) => {
										e.preventDefault()
										e.stopPropagation()
										if (!confirm('Delete this unit and its lessons?')) return
										await deleteUnit(unit.id)
										// if they deleted what they were looking at, reset selection
										if (selection.unitId === unit.id) {
											onSelect({ kind: 'course', unitId: '', lessonId: '' })
										}
										router.refresh()
									}}
								>
									Delete
								</Button>
							</div>

							<AccordionContent className="space-y-3 pt-2">
								<LessonAdder
									unitId={unit.id}
									onAdded={() => router.refresh()}
								/>

								<div className="space-y-1">
									{unit.lessons.map((lesson) => {
										const lessonActive =
											selection.kind === 'lesson' &&
											selection.lessonId === lesson.id

										return (
											<div
												key={lesson.id}
												className={`flex items-center justify-between rounded-md px-2 py-1 text-sm ${
													lessonActive
														? 'bg-muted font-medium'
														: 'hover:bg-muted'
												}`}
											>
												<button
													className="text-left flex-1"
													onClick={() =>
														onSelect({
															kind: 'lesson',
															unitId: unit.id,
															lessonId: lesson.id,
														})
													}
												>
													{lesson.title}
												</button>

												<Button
													type="button"
													size="sm"
													variant="ghost"
													className="text-destructive"
													onClick={async () => {
														if (!confirm('Delete this lesson and all blocks?'))
															return
														await deleteLesson(lesson.id)
														if (selection.lessonId === lesson.id) {
															onSelect({
																kind: 'unit',
																unitId: unit.id,
																lessonId: '',
															})
														}
														router.refresh()
													}}
												>
													Delete
												</Button>
											</div>
										)
									})}
								</div>
							</AccordionContent>
						</AccordionItem>
					)
				})}
			</Accordion>
		</div>
	)
}

function LessonAdder(props: { unitId: string; onAdded: () => void }) {
	const { unitId, onAdded } = props
	const [lessonTitle, setLessonTitle] = useState('')

	return (
		<div className="flex gap-2">
			<Input
				value={lessonTitle}
				onChange={(e) => setLessonTitle(e.target.value)}
				placeholder="New lesson title"
			/>
			<Button
				type="button"
				disabled={!lessonTitle.trim()}
				onClick={async () => {
					await createLesson({ unitId, title: lessonTitle.trim() })
					setLessonTitle('')
					onAdded()
				}}
			>
				Add
			</Button>
		</div>
	)
}
