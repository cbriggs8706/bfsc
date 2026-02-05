// app/api/test/email-outbox/route.ts
import { NextResponse } from 'next/server'
import { clearEmailOutbox, getEmailOutbox } from '@/lib/email/mailer'

function isAllowed(req: Request) {
	if (process.env.NODE_ENV === 'production') return false

	const secret = process.env.E2E_OUTBOX_SECRET
	if (!secret) return true

	return req.headers.get('x-e2e-secret') === secret
}

export async function GET(req: Request) {
	if (!isAllowed(req)) {
		return new NextResponse('Not found', { status: 404 })
	}

	return NextResponse.json({ outbox: getEmailOutbox() })
}

export async function DELETE(req: Request) {
	if (!isAllowed(req)) {
		return new NextResponse('Not found', { status: 404 })
	}

	clearEmailOutbox()
	return NextResponse.json({ ok: true })
}
