import { NextResponse } from 'next/server'
import { db } from '@/db'
import { verificationToken } from '@/db'
import { requireRole } from '@/utils/require-role'
import { hashResetToken } from '@/lib/auth/password-reset-utils'

function random6Digit() {
	return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params

		// ensure admin/director
		await requireRole('en', ['Admin', 'Director']) // adjust if your helper needs locale from req

		const code = random6Digit()
		const tokenHash = hashResetToken(code)
		const expires = new Date(Date.now() + 60 * 60 * 1000)

		await db.insert(verificationToken).values({
			identifier: `pwdreset:code:${id}`,
			token: tokenHash,
			expires,
		})

		// return the raw code to staff (they will read it to patron)
		return NextResponse.json({ ok: true, code, expires })
	} catch (err) {
		console.error(err)
		return NextResponse.json(
			{ error: 'Could not create reset code' },
			{ status: 500 }
		)
	}
}
