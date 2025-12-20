// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(req: NextRequest) {
	const res = NextResponse.next()
	res.headers.set('x-pathname', req.nextUrl.pathname)
	return res
}
