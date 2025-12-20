import { CertificateStatus } from '@/db/queries/training'

export function CertificateBadge({ status }: { status: CertificateStatus }) {
	if (status === 'external') return null

	const styles: Record<CertificateStatus, string> = {
		current: 'bg-(--green-logo-soft) text-(--green-logo) border-(--green-logo)',
		renewal:
			'bg-(--purple-accent-soft) text-(--purle-accent) border-(--purple-accent)',
		expired: 'bg-(--red-accent-soft) text-(--red-accent) border(--red-accent)',
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
			className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border ${styles[status]}`}
		>
			{labels[status]}
		</span>
	)
}
