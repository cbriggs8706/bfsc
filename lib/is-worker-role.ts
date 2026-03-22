// lib/isWorkerRole.ts
const WORKER_ROLES = [
	'worker',
	'shift lead',
	'assistant director',
	'director',
	'admin',
] as const

export type WorkerRole = (typeof WORKER_ROLES)[number]

export function isWorkerRole(role: string | null | undefined): boolean {
	if (!role) return false
	return WORKER_ROLES.includes(role.trim().toLowerCase() as WorkerRole)
}
