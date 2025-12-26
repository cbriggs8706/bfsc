// lib/actions/resource/resource.ts
'use server'
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'
import { db, resource } from '@/db'
import { Resource } from '@/types/resource'
import { redirect } from 'next/navigation'
export async function readResource(id: string) {
	noStore()
	return db.query.resource.findFirst({
		where: eq(resource.id, id),
	})
}

export async function readResources() {
	noStore()
	return db.query.resource.findMany({
		orderBy: resource.name,
	})
}

/* -------------------------------------------------
 * Writes
 * ------------------------------------------------- */

export async function createResource(input: Resource, locale?: string) {
	const { id, ...data } = input

	if (!input.name || input.name.length < 3) {
		throw new Error('Name is required')
	}

	await db.insert(resource).values({
		...data,
		capacity: input.type === 'activity' ? input.capacity : null,
		maxConcurrent: input.type === 'activity' ? 1 : input.maxConcurrent,
	})

	revalidatePath('/admin/resource')

	// ✅ Redirect after successful create
	redirect(`/${locale ?? 'en'}/admin/resource`)
}

export async function updateResource(id: string, input: Resource) {
	if (!id) throw new Error('Missing resource id')

	const [row] = await db
		.update(resource)
		.set({
			...input,
			capacity: input.type === 'activity' ? input.capacity : null,
			maxConcurrent: input.type === 'activity' ? 1 : input.maxConcurrent,
		})
		.where(eq(resource.id, id))
		.returning()

	revalidatePath(`/admin/resource/${id}`)
	return row
}

export async function deleteResource(id: string) {
	if (!id) throw new Error('Missing resource id')

	await db.delete(resource).where(eq(resource.id, id))
	revalidatePath('/admin/resource')
}
