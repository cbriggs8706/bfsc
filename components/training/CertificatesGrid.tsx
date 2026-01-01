'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { CertificateBadge } from './CertificateBadge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DashboardCertificateItem,
	EarnedCertificate,
	MissingCertificate,
} from '@/db/queries/training'

/* ======================================================
 * Types
 * ==================================================== */

type Props = {
	certificates: DashboardCertificateItem[]
	locale: string
}

/* ======================================================
 * Component
 * ==================================================== */

export function CertificatesGrid({ certificates, locale }: Props) {
	const [activeCert, setActiveCert] = useState<EarnedCertificate | null>(null)

	const earned = certificates.filter(
		(c): c is EarnedCertificate => c.kind === 'earned'
	)

	const missing = certificates.filter(
		(c): c is MissingCertificate => c.kind === 'missing'
	)

	if (certificates.length === 0) {
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

			<div className="border bg-card rounded-xl p-4">
				<div className="flex flex-wrap items-start justify-center gap-4">
					{/* =====================
					 * Earned Certificates
					 * =================== */}
					{earned.map((cert) => (
						<button
							key={cert.id}
							onClick={() => setActiveCert(cert)}
							className="group focus:outline-none"
						>
							<div className="flex flex-col items-center gap-1 w-20">
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

								<span className="text-[9px] text-center">{cert.title}</span>

								<CertificateBadge status={cert.status} />
							</div>
						</button>
					))}

					{/* =====================
					 * Missing Certificates
					 * =================== */}
					{missing.map((course) => (
						<Link
							key={course.courseId}
							href={`/${locale}/training/courses/${course.courseId}`}
							className="group"
						>
							<div className="flex flex-col items-center gap-1 w-20">
								<div className="w-20 h-20 rounded-md border border-dashed border-muted-foreground bg-background flex items-center justify-center">
									<span className="text-xs text-muted-foreground text-wrap text-center">
										{course.title}
									</span>
								</div>

								<span className="text-[9px] text-muted-foreground text-center">
									Not earned yet
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* =====================
			 * Details Dialog
			 * =================== */}
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
									: 'External certificate'}
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
