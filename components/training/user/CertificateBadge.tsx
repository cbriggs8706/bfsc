import { CertificateStatus } from '@/db/queries/training'

export function CertificateBadge({ status }: { status: CertificateStatus }) {
	if (status === 'external') return null

	const styles: Record<CertificateStatus, string> = {
		current: 'bg-green-100 text-green-800 border-green-300',
		renewal: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		expired: 'bg-gray-100 text-gray-600 border-gray-300',
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
