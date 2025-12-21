// app/api/shifts/current/route.ts
import { NextResponse } from 'next/server'
import { getCurrentPresence } from '@/db/queries/shifts/get-current-presence'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
	const data = await getCurrentPresence()
	return NextResponse.json(data)
}
