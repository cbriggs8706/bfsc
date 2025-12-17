// types/faiths.ts
export type Ward = {
	id: string
	name: string
}

export type Stake = {
	id: string
	name: string
	wards: Ward[]
}

export type Faith = {
	id: string
	name: string
	address: string | null
	city: string | null
	stakes: Stake[]
}

export type Position = {
	id: string
	name: string
}
