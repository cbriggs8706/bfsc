'use client'

import { useState } from 'react'
import { UserCertificateWithStatus } from '@/db/queries/training'
import Link from 'next/link'
import { CertificateBadge } from './CertificateBadge'
import Image from 'next/image'

type Props = {
	certificates: UserCertificateWithStatus[]
	locale: string
}

export function CertificatesGrid({ certificates, locale }: Props) {
	const [showExpired, setShowExpired] = useState(false)
	const collapsed = collapseCertificates(certificates)

	const visible = collapsed.filter((c) => showExpired || c.status !== 'expired')

	if (visible.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				You haven’t earned any certificates yet.
			</p>
		)
	}

	function collapseCertificates(
		certs: UserCertificateWithStatus[]
	): UserCertificateWithStatus[] {
		const byCourse = new Map<string, UserCertificateWithStatus>()
		const result: UserCertificateWithStatus[] = []

		for (const cert of certs) {
			// External certs are always shown as-is
			if (cert.source === 'external' || !cert.courseId) {
				result.push(cert)
				continue
			}

			const existing = byCourse.get(cert.courseId)

			if (!existing) {
				byCourse.set(cert.courseId, cert)
				continue
			}

			// Prefer CURRENT over renewal/expired
			if (existing.status !== 'current' && cert.status === 'current') {
				byCourse.set(cert.courseId, cert)
			}
		}

		return [...result, ...byCourse.values()]
	}

	return (
		<div className="space-y-3">
			<button
				onClick={() => setShowExpired((v) => !v)}
				className="text-xs underline text-muted-foreground"
			>
				{showExpired
					? 'Hide expired certificates'
					: 'Show expired certificates'}
			</button>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{visible.map((cert) => (
					<div
						key={cert.id}
						className="border rounded-lg p-4 space-y-2 relative"
					>
						<CertificateBadge status={cert.status} />
						{cert.badgeImageUrl && (
							<Image
								src={cert.badgeImageUrl}
								alt=""
								width={48}
								height={48}
								className="rounded"
							/>
						)}

						<p className="font-semibold">{cert.title}</p>

						{cert.category && (
							<p className="text-sm text-muted-foreground">
								{cert.category}
								{cert.level ? ` • Level ${cert.level}` : ''}
							</p>
						)}

						<p className="text-xs text-muted-foreground">
							{cert.source === 'internal'
								? 'BFSC certificate'
								: 'Genie Greenie certificate'}
						</p>

						<p className="text-xs text-muted-foreground">
							Earned {cert.issuedAt.toLocaleDateString()}
						</p>

						{cert.status === 'renewal' && cert.courseId && (
							<Link
								href={`/${locale}/training/courses/${cert.courseId}`}
								className="text-xs underline text-primary"
							>
								Renew now
							</Link>
						)}

						{cert.verifyUrl && (
							<a
								href={cert.verifyUrl}
								target="_blank"
								rel="noreferrer"
								className="text-xs underline text-primary"
							>
								Verify
							</a>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
