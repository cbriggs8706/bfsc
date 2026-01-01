// app/actions/get-faith-tree.ts
'use server'

import { getFaithTree } from '@/db/queries/faiths'

export async function fetchFaithTree() {
	return getFaithTree()
}
