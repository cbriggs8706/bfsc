// app/actions/faiths.ts
'use server'

import { db } from '@/db'
import { faiths, positions, stakes, wards } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createFaith(data: {
	name: string
	address?: string
	city?: string
}) {
	await db.insert(faiths).values(data)
	revalidatePath('/admin/center/faiths')
}

export async function updateFaith(
	id: string,
	data: Partial<{
		name: string
		address: string | null
		city: string | null
	}>
) {
	await db.update(faiths).set(data).where(eq(faiths.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function deleteFaith(id: string) {
	await db.delete(faiths).where(eq(faiths.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function createStake(data: { faithId: string; name: string }) {
	await db.insert(stakes).values(data)
	revalidatePath('/admin/center/faiths')
}

export async function updateStake(id: string, data: { name: string }) {
	await db.update(stakes).set(data).where(eq(stakes.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function deleteStake(id: string) {
	await db.delete(stakes).where(eq(stakes.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function createWard(data: { stakeId: string; name: string }) {
	await db.insert(wards).values(data)
	revalidatePath('/admin/center/faiths')
}

export async function updateWard(id: string, data: { name: string }) {
	await db.update(wards).set(data).where(eq(wards.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function deleteWard(id: string) {
	await db.delete(wards).where(eq(wards.id, id))
	revalidatePath('/admin/center/faiths')
}

export async function createPosition(name: string) {
	await db.insert(positions).values({ name })
	revalidatePath('/admin/center/positions')
}

export async function updatePosition(id: string, name: string) {
	await db.update(positions).set({ name }).where(eq(positions.id, id))
	revalidatePath('/admin/center/positions')
}

export async function deletePosition(id: string) {
	await db.delete(positions).where(eq(positions.id, id))
	revalidatePath('/admin/center/positions')
}
