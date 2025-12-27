// lib/isWorkerRole.ts
const WORKER_ROLES = [
	'Worker',
	'Shift Lead',
	'Assistant Director',
	'Director',
] as const

export type WorkerRole = (typeof WORKER_ROLES)[number]

export function isWorkerRole(role: string | null | undefined): boolean {
	if (!role) return false
	return WORKER_ROLES.includes(role as WorkerRole)
}
