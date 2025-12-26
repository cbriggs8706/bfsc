// app/[locale]/admin/center/page.tsx

import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Props = {
	params: Promise<{ locale: string }>
}

// export const metadata: Metadata = {
// 	title: 'Manage Center Definitions',
// }

export default async function Page({ params }: Props) {
	const { locale } = await params

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Center Definitions</h1>
				<p className="text-sm text-muted-foreground">
					Set the main details of your center. You shouldn&apos;t need to change
					these very often other than initial setup.
				</p>
			</div>
			<ul className="space-y-4">
				<li>
					{' '}
					<Link href={`/${locale}/admin/kiosk/hours`}>
						<Button>Define Hours</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/shifts/define`}>
						<Button>Define Shifts</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/kiosk/purposes`}>
						<Button>Define Purposes</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/case-types`}>
						<Button>Define Case Types</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/faiths`}>
						<Button>Define Faiths</Button>
					</Link>
				</li>
				<li>
					{' '}
					<Link href={`/${locale}/admin/center/positions`}>
						<Button>Define Positions</Button>
					</Link>
				</li>
			</ul>
		</div>
	)
}
