import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
const CMS_IMAGE_BUCKET = 'training-content'
const ALLOWED_ROLES = ['Admin', 'Director', 'Assistant Director']

function sanitizeFilename(name: string) {
	return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function POST(request: Request) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!ALLOWED_ROLES.includes(user.role)) {
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
	const path = `cms-pages/${filename}`
	const bytes = new Uint8Array(await file.arrayBuffer())

	const { error } = await supabaseAdmin.storage
		.from(CMS_IMAGE_BUCKET)
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
		.from(CMS_IMAGE_BUCKET)
		.getPublicUrl(path)

	if (!data.publicUrl) {
		return NextResponse.json(
			{ error: 'Could not generate public URL' },
			{ status: 500 }
		)
	}

	return NextResponse.json({ url: data.publicUrl })
}
