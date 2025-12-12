// app/api/kiosk/people/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { isConsultantRole } from '@/lib/is-consultant-role'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'

function generatePasscode() {
	// simple 6-digit random; you might want to check for collisions
	return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
	const { fullName, email, wantsPasscode, userId } = (await req.json()) as {
		fullName: string
		email?: string
		wantsPasscode?: boolean
		userId?: string | null // if we know this person is also in user table
	}

	let passcode: string | null = null

	if (wantsPasscode) {
		// loop until we find a unique one (collisions are very unlikely at your scale)
		// but we keep it safe.
		while (true) {
			const candidate = generatePasscode()
			const existing = await db.query.kioskPeople.findFirst({
				where: eq(kioskPeople.passcode, candidate),
			})
			if (!existing) {
				passcode = candidate
				break
			}
		}
	}

	let isConsultantCached = false
	if (userId) {
		const u = await db.query.user.findFirst({ where: eq(user.id, userId) })
		if (u) {
			isConsultantCached = isConsultantRole(u.role)
		}
	}

	const [person] = await db
		.insert(kioskPeople)
		.values({
			fullName,
			email: email ?? null,
			userId: userId ?? null,
			passcode,
			isConsultantCached,
		})
		.returning()

	return NextResponse.json({
		person: {
			id: person.id,
			fullName: person.fullName,
			userId: person.userId,
			hasPasscode: !!person.passcode,
			passcode: person.passcode, // show once so they can write it down
			isConsultant: isConsultantCached,
		},
	})
}
