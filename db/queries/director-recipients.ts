import { db, user } from '@/db'
import { eq } from 'drizzle-orm'

export async function getDirectorRecipients() {
	const directors = await db.query.user.findMany({
		where: eq(user.role, 'Director'),
		columns: { name: true, email: true },
	})

	return directors.filter((d) => d.email).map((d) => ({
		name: d.name,
		email: d.email!,
	}))
}
