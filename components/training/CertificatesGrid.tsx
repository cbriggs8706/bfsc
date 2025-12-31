'use client'

import { useState } from 'react'
import { UserCertificateWithStatus } from '@/db/queries/training'
import Link from 'next/link'
import Image from 'next/image'
import { CertificateBadge } from './CertificateBadge'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '../ui/button'

type Props = {
	certificates: UserCertificateWithStatus[]
	locale: string
}

export function CertificatesGrid({ certificates, locale }: Props) {
	const [activeCert, setActiveCert] =
		useState<UserCertificateWithStatus | null>(null)

	const collapsed = collapseCertificates(certificates)
	const visible = collapsed.filter((c) => c.status !== 'expired')

	if (visible.length === 0) {
		return (
			<div className="space-y-3">
				<h2 className="text-2xl font-semibold">My Certificates</h2>
				<div className="border bg-card rounded-xl p-8 space-y-4">
					<p className="text-sm text-muted-foreground">
						You haven’t earned any certificates yet.
					</p>
					<Link href={`/${locale}/training`}>
						<Button>View Worker Training Courses</Button>
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">My Certificates</h2>

			{/* Single large card */}
			<div className="border bg-card rounded-xl p-4">
				<div className="flex flex-wrap items-center justify-center gap-4">
					{visible.map((cert) => (
						<button
							key={cert.id}
							onClick={() => setActiveCert(cert)}
							className="group focus:outline-none"
						>
							<div className="flex flex-col items-center gap-1">
								{cert.badgeImageUrl ? (
									<Image
										src={cert.badgeImageUrl}
										alt={cert.title}
										width={56}
										height={56}
										className="rounded-md transition-transform group-hover:scale-105"
									/>
								) : (
									<div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs">
										CERT
									</div>
								)}
								{/* TODO update font size after character limit */}
								<span className="text-[9px]">{cert.title}</span>
								<CertificateBadge status={cert.status} />
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Details dialog */}
			<Dialog open={!!activeCert} onOpenChange={() => setActiveCert(null)}>
				{activeCert && (
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{activeCert.title}</DialogTitle>
						</DialogHeader>

						<div className="space-y-3 text-sm">
							{activeCert.category && (
								<p className="text-muted-foreground">
									{activeCert.category}
									{activeCert.level ? ` • Level ${activeCert.level}` : ''}
								</p>
							)}

							<p className="text-muted-foreground">
								{activeCert.source === 'internal'
									? 'BFSC certificate'
									: 'Genie Greenie certificate'}
							</p>

							<p className="text-muted-foreground">
								Earned {activeCert.issuedAt.toLocaleDateString()}
							</p>

							{activeCert.status === 'renewal' && activeCert.courseId && (
								<Link
									href={`/${locale}/training/courses/${activeCert.courseId}`}
									className="inline-block text-primary underline"
								>
									Renew now
								</Link>
							)}

							{activeCert.verifyUrl && (
								<a
									href={activeCert.verifyUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-block text-primary underline"
								>
									Verify certificate
								</a>
							)}
						</div>
					</DialogContent>
				)}
			</Dialog>
		</div>
	)
}

/* ======================================================
 * Helpers
 * ==================================================== */

function collapseCertificates(
	certs: UserCertificateWithStatus[]
): UserCertificateWithStatus[] {
	const byCourse = new Map<string, UserCertificateWithStatus>()
	const result: UserCertificateWithStatus[] = []

	for (const cert of certs) {
		if (cert.source === 'external' || !cert.courseId) {
			result.push(cert)
			continue
		}

		const existing = byCourse.get(cert.courseId)

		if (!existing) {
			byCourse.set(cert.courseId, cert)
			continue
		}

		if (existing.status !== 'current' && cert.status === 'current') {
			byCourse.set(cert.courseId, cert)
		}
	}

	return [...result, ...byCourse.values()]
}
