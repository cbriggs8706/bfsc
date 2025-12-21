import { CertificateStatus } from '@/db/queries/training'

export function CertificateBadge({ status }: { status: CertificateStatus }) {
	if (status === 'external') return null

	const styles: Record<CertificateStatus, string> = {
		current: 'bg-(--green-logo-soft) text-(--green-logo) border-(--green-logo)',
		renewal:
			'bg-(--purple-accent-soft) text-(--purple-accent) border-(--purple-accent)',
		expired: 'bg-(--red-accent-soft) text-(--red-accent) border-(--red-accent)',
		external: '',
	}

	const labels: Record<CertificateStatus, string> = {
		current: 'Current',
		renewal: 'Renewal required',
		expired: 'Expired',
		external: '',
	}

	return (
		<span
			className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[status]}`}
		>
			{labels[status]}
		</span>
	)
}
