// lib/reservations/resource-type.ts
import { ResourceType } from '@/types/resource'

export function isResourceType(value: string): value is ResourceType {
	return (
		value === 'equipment' ||
		value === 'room' ||
		value === 'booth' ||
		value === 'activity'
	)
}
