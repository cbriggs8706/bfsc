import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { can } from '@/lib/permissions/can'

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function POST(request: Request) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const [canCreate, canUpdate] = await Promise.all([
		can(user.id, user.role, 'newsletters.create'),
		can(user.id, user.role, 'newsletters.update'),
	])
	if (!canCreate && !canUpdate) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const formData = await request.formData()
	const file = formData.get('file')
	const kind = formData.get('kind')

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'Missing file' }, { status: 400 })
	}

	if (kind !== 'cover' && kind !== 'content') {
		return NextResponse.json({ error: 'Invalid upload kind' }, { status: 400 })
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
	const path = kind === 'cover' ? `covers/${filename}` : `newsletter/${filename}`
	const bucket = kind === 'cover' ? 'newsletter-covers' : 'newsletter-images'

	const bytes = new Uint8Array(await file.arrayBuffer())
	const { error } = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
		contentType: file.type || 'image/*',
		upsert: false,
	})

	if (error) {
		return NextResponse.json(
			{ error: `Upload failed: ${error.message}` },
			{ status: 500 }
		)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
	if (!data.publicUrl) {
		return NextResponse.json(
			{ error: 'Could not generate public URL' },
			{ status: 500 }
		)
	}

	return NextResponse.json({ url: data.publicUrl })
}
