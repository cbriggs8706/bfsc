'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUnit, deleteUnit } from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LessonsEditor } from './LessonsEditor'
import { AdminUnit } from '@/types/training'

type Props = {
	courseId: string
	units: AdminUnit[]
}

export function UnitsEditor({ courseId, units }: Props) {
	const router = useRouter()

	const [title, setTitle] = useState('')

	return (
		<div className="space-y-4">
			<h3 className="font-semibold">Units</h3>

			<div className="flex gap-2">
				<Input
					value={title}
					placeholder="New unit title"
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Button
					onClick={async () => {
						await createUnit({ courseId, title })
						setTitle('')
						router.refresh()
					}}
					disabled={!title}
				>
					Add Unit
				</Button>
			</div>

			{units.map((unit) => (
				<Card key={unit.id} className="p-4 space-y-3">
					<div className="flex justify-between items-center">
						<h4 className="font-medium">{unit.title}</h4>

						<Button
							size="sm"
							variant="destructive"
							onClick={async () => {
								if (!confirm('Delete this unit and its lessons?')) return
								await deleteUnit(unit.id)
								router.refresh()
							}}
						>
							Delete Unit
						</Button>
					</div>

					<LessonsEditor unitId={unit.id} lessons={unit.lessons} />
				</Card>
			))}
		</div>
	)
}
