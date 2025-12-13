// utils/upload-case-image.ts
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadCaseImage(file: File) {
	const path = `cases/${crypto.randomUUID()}.${file.name.split('.').pop()}`

	const { error } = await supabaseAdmin.storage
		.from('case-attachments')
		.upload(path, file)

	if (error) throw error

	const { data } = supabaseAdmin.storage
		.from('case-attachments')
		.getPublicUrl(path)

	return {
		fileUrl: data.publicUrl,
		fileType: file.type,
	}
}
