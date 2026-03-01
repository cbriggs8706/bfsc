'use client'

import { useState } from 'react'
import Link from 'next/link'

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
import { CourseBadgeIcon } from './CourseBadgeIcon'
import { cn } from '@/lib/utils'

/* ======================================================
 * Types
 * ==================================================== */

type Props = {
	certificates: DashboardCertificateItem[]
	locale: string
	className?: string
	cardClassName?: string
	preferSingleRow?: boolean
}

/* ======================================================
 * Component
 * ==================================================== */

export function CertificatesGrid({
	certificates,
	locale,
	className,
	cardClassName,
	preferSingleRow = false,
}: Props) {
	const [activeCert, setActiveCert] = useState<EarnedCertificate | null>(null)

	const earned = certificates.filter(
		(c): c is EarnedCertificate => c.kind === 'earned'
	)

	const missing = certificates.filter(
		(c): c is MissingCertificate => c.kind === 'missing'
	)

	if (certificates.length === 0) {
		return (
			<div className={cn('space-y-3', className)}>
				<h2 className="text-2xl font-semibold">My Certificates</h2>
				<div className={cn('border bg-card rounded-xl p-8 space-y-4', cardClassName)}>
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
		<div className={cn('space-y-3', className)}>
			<h2 className="text-2xl font-semibold">My Certificates</h2>

			<div className={cn('border bg-card rounded-xl p-6', cardClassName)}>
				<div
					className={cn(
						'grid gap-5',
						preferSingleRow
							? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
							: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
					)}
				>
					{/* =====================
					 * Earned Certificates
					 * =================== */}
					{earned.map((cert) => (
						<button
							key={cert.id}
							onClick={() => setActiveCert(cert)}
							className="group focus:outline-none justify-self-center"
						>
							<div className="flex w-28 flex-col items-center gap-2">
								<CourseBadgeIcon
									iconName={cert.badgeIconName}
									svgUrl={cert.badgeImageUrl}
									label={cert.title}
									size="lg"
									className="transition-transform group-hover:scale-105"
								/>

								<span className="line-clamp-2 text-center text-sm font-medium leading-tight">
									{cert.title}
								</span>

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
							href={course.href ?? `/${locale}/training/courses/${course.courseId}`}
							className="group justify-self-center"
						>
							<div className="flex w-28 flex-col items-center gap-2">
								<CourseBadgeIcon
									iconName={course.badgeIconName}
									svgUrl={course.badgeImageUrl}
									label={course.title}
									size="lg"
									className="opacity-55"
								/>

								<span className="line-clamp-2 text-center text-sm font-medium leading-tight text-muted-foreground">
									{course.title}
								</span>

								<span className="text-center text-xs text-muted-foreground">
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
