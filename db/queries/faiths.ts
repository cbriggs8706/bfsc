// db/queries/faiths.ts
import { db } from '@/db'
import { faiths, callings, stakes, wards } from '@/db'
import { Faith } from '@/types/faiths'
import { eq } from 'drizzle-orm'

export function getFaiths() {
	return db.select().from(faiths).orderBy(faiths.name)
}

export function getFaithById(id: string) {
	return db.select().from(faiths).where(eq(faiths.id, id)).limit(1)
}

export function getStakesByFaith(faithId: string) {
	return db
		.select({
			id: stakes.id,
			name: stakes.name,
			faithName: faiths.name,
		})
		.from(stakes)
		.innerJoin(faiths, eq(stakes.faithId, faiths.id))
		.where(eq(stakes.faithId, faithId))
		.orderBy(stakes.name)
}

export function getWardsByStake(stakeId: string) {
	return db
		.select({
			id: wards.id,
			name: wards.name,
			stakeName: stakes.name,
		})
		.from(wards)
		.innerJoin(stakes, eq(wards.stakeId, stakes.id))
		.where(eq(wards.stakeId, stakeId))
		.orderBy(wards.name)
}

export function getCallings() {
	return db.select().from(callings).orderBy(callings.name)
}

export async function getFaithTree(): Promise<Faith[]> {
	const rows = await db
		.select({
			faithId: faiths.id,
			faithName: faiths.name,
			address: faiths.address,
			city: faiths.city,
			stakeId: stakes.id,
			stakeName: stakes.name,
			wardId: wards.id,
			wardName: wards.name,
		})
		.from(faiths)
		.leftJoin(stakes, eq(stakes.faithId, faiths.id))
		.leftJoin(wards, eq(wards.stakeId, stakes.id))
		.orderBy(faiths.name, stakes.name, wards.name)

	const map = new Map<string, Faith>()

	for (const r of rows) {
		if (!map.has(r.faithId)) {
			map.set(r.faithId, {
				id: r.faithId,
				name: r.faithName,
				address: r.address,
				city: r.city,
				stakes: [],
			})
		}

		const faith = map.get(r.faithId)!

		if (r.stakeId) {
			let stake = faith.stakes.find((s) => s.id === r.stakeId)

			if (!stake) {
				stake = {
					id: r.stakeId,
					name: r.stakeName!,
					wards: [],
				}
				faith.stakes.push(stake)
			}

			if (r.wardId) {
				stake.wards.push({
					id: r.wardId,
					name: r.wardName!,
				})
			}
		}
	}

	return Array.from(map.values())
}
