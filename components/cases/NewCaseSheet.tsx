// components/cases/NewCaseSheet.tsx
'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createCase } from '@/app/actions/cases/create-case'
import { CaseTypeSelect } from './CaseTypeSelect'
import { ImagePicker } from './ImagePicker'
import { CaseType } from '@/types/cases'
import { PlusCircle } from 'lucide-react'

export function NewCaseSheet({
	caseTypes,
	locale,
}: {
	caseTypes: CaseType[]
	locale: string
}) {
	const router = useRouter()

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [typeId, setTypeId] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [images, setImages] = useState<File[]>([])

	async function handleSubmit() {
		// ✅ VALIDATE FIRST
		if (!title.trim() || !description.trim() || !typeId) return

		try {
			setSubmitting(true)

			const formData = new FormData()
			formData.append('title', title)
			formData.append('description', description)
			formData.append('typeId', typeId)

			images.forEach((img) => {
				formData.append('images', img)
			})

			const created = await createCase(formData)
			router.push(`/${locale}/cases/${created.id}`)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button className="fixed bottom-4 right-4 z-50 rounded-full h-16 w-35">
					<PlusCircle className="h-6 w-6" />
					New Case
				</Button>
			</SheetTrigger>

			<SheetContent side="bottom" className="h-[90vh] space-y-4">
				<h2 className="text-lg font-bold">Create Case</h2>

				<Input
					placeholder="Short title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>

				<Textarea
					placeholder="Describe the issue…"
					rows={4}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>

				<CaseTypeSelect
					value={typeId}
					onChange={setTypeId}
					options={caseTypes}
				/>

				<ImagePicker onAdd={(file) => setImages((p) => [...p, file])} />

				<Button
					className="w-full"
					onClick={handleSubmit}
					disabled={
						submitting || !title.trim() || !description.trim() || !typeId
					}
				>
					{submitting ? 'Creating…' : 'Submit'}
				</Button>
			</SheetContent>
		</Sheet>
	)
}
