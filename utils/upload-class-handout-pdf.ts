// utils/upload-class-handout-pdf.ts
'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadClassHandoutPdf(file: File): Promise<{
	fileName: string
	filePath: string
	publicUrl: string | null
}> {
	const bucket = 'classes'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `sessions/handouts/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'application/pdf',
			upsert: false,
		})

	if (error) {
		throw new Error(`Supabase upload failed: ${error.message}`)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

	return {
		fileName: file.name,
		filePath: path,
		publicUrl: data.publicUrl ?? null,
	}
}
