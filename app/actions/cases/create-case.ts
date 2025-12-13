// app/actions/cases/create-case.ts
'use server'

import { db, cases, caseWatchers, caseAttachments } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { uploadCaseImage } from '@/utils/upload-case-image'

export async function createCase(formData: FormData) {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	const title = formData.get('title') as string
	const description = formData.get('description') as string
	const typeId = formData.get('typeId') as string
	const files = formData.getAll('images') as File[]

	const [created] = await db
		.insert(cases)
		.values({
			title,
			description,
			typeId,
			createdByUserId: user.id,
		})
		.returning()

	// Auto-watch creator
	await db.insert(caseWatchers).values({
		caseId: created.id,
		userId: user.id,
	})

	// Upload & attach images (SERVER-SIDE, SAFE)
	if (files.length) {
		const uploaded = await Promise.all(files.map(uploadCaseImage))

		await db.insert(caseAttachments).values(
			uploaded.map((a) => ({
				caseId: created.id,
				uploadedByUserId: user.id,
				fileUrl: a.fileUrl,
				fileType: a.fileType,
			}))
		)
	}

	return created
}
