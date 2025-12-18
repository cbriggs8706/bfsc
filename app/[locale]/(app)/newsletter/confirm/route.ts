// app/[locale]/(app)/newsletter/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { newsletterSubscribers } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ locale: string }> }
) {
	const { locale } = await context.params
	const token = req.nextUrl.searchParams.get('token')

	const safeLocale = locale ?? 'en'

	if (!token) {
		return NextResponse.redirect(new URL(`/${safeLocale}`, req.url))
	}

	const subscriber = await db.query.newsletterSubscribers.findFirst({
		where: eq(newsletterSubscribers.confirmToken, token),
	})

	if (!subscriber) {
		return NextResponse.redirect(new URL(`/${safeLocale}`, req.url))
	}

	if (!subscriber.isConfirmed) {
		await db
			.update(newsletterSubscribers)
			.set({
				isConfirmed: true,
				confirmedAt: new Date(),
			})
			.where(eq(newsletterSubscribers.id, subscriber.id))
	}

	return NextResponse.redirect(new URL(`/${safeLocale}?subscribed=1`, req.url))
}
