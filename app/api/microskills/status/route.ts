import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
	GenieGreenieClientError,
	normalizeStatusesBySlug,
	lookupMicroskillStatusesByEmail,
} from '@/lib/genieGreenieClient'

export async function GET(request: Request) {
	const user = await getCurrentUser()
	if (!user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { searchParams } = new URL(request.url)
	const requestedEmail = searchParams.get('email')?.trim().toLowerCase() ?? ''

	const email = requestedEmail || user.email.trim().toLowerCase()
	if (!email) {
		return NextResponse.json({ error: 'Email is required' }, { status: 400 })
	}

	if (requestedEmail && requestedEmail !== user.email?.trim().toLowerCase()) {
		if (user.role !== 'Admin') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}
	}

	try {
		const lookup = await lookupMicroskillStatusesByEmail(email)
		const statuses = normalizeStatusesBySlug(lookup.statuses)

		return NextResponse.json({ email: lookup.email, statuses })
	} catch (error) {
		if (error instanceof GenieGreenieClientError) {
			const status =
				error.code === 'BAD_REQUEST'
					? 400
					: error.code === 'UNAUTHORIZED'
						? 502
						: error.code === 'CONFIG'
							? 500
							: error.status && error.status >= 400
								? 502
								: 502

			return NextResponse.json(
				{
					error:
						status === 500
							? 'Genie Greenie integration is not configured'
							: 'Unable to fetch Genie Greenie microskill status',
				},
				{ status }
			)
		}

		return NextResponse.json(
			{ error: 'Unable to fetch Genie Greenie microskill status' },
			{ status: 500 }
		)
	}
}
