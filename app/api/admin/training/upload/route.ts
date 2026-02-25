import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { can } from '@/lib/permissions/can'

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const TRAINING_IMAGE_BUCKET = 'training-content'

function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function POST(request: Request) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const canManageTraining = await can(user.id, user.role, 'training.create')
	if (!canManageTraining) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const formData = await request.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'Missing file' }, { status: 400 })
	}

	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		return NextResponse.json(
			{ error: 'File too large. Max size is 10MB.' },
			{ status: 400 }
		)
	}

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
	const filename = sanitizeFilename(
		`${Date.now()}-${crypto.randomUUID()}.${ext}`
	)
	const path = `training/${filename}`

	const bytes = new Uint8Array(await file.arrayBuffer())
	const { error } = await supabaseAdmin.storage
		.from(TRAINING_IMAGE_BUCKET)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (error) {
		return NextResponse.json(
			{ error: `Upload failed: ${error.message}` },
			{ status: 500 }
		)
	}

	const { data } = supabaseAdmin.storage
		.from(TRAINING_IMAGE_BUCKET)
		.getPublicUrl(path)

	if (!data.publicUrl) {
		return NextResponse.json(
			{ error: 'Could not generate public URL' },
			{ status: 500 }
		)
	}

	return NextResponse.json({ url: data.publicUrl })
}
