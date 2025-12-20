'use client'

import { Button } from '@/components/ui/button'

export function PrintScheduleButton() {
	return <Button onClick={() => window.print()}>Print Schedule</Button>
}
