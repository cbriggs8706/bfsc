import { AdminCheckpointContributions } from '@/components/admin/projects/AdminCheckpointContributions'
import { CheckpointForm } from '@/components/admin/projects/CheckpointForm'
import {
	readCheckpointContributions,
	readCheckpointForForm,
} from '@/lib/actions/projects/checkpoints'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type Props = {
	params: Promise<{ locale: string; id: string }>
}

export default async function AdminCheckpointDeletePage({ params }: Props) {
	const { locale, id } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	if (!session) redirect(`/${locale}`)

	const checkpoint = await readCheckpointForForm(id)
	if (!checkpoint) {
		redirect(`/${locale}/admin/projects`)
	}

	const contributions = await readCheckpointContributions(locale, id)

	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">
					{t('update')} {checkpoint.name}
				</h1>
				<p className="text-base text-muted-foreground max-w-3xl">
					{t('projects.checkpointsSub')}
				</p>
			</div>
			<CheckpointForm
				mode="update"
				initialValues={checkpoint}
				checkpointId={checkpoint.id}
				locale={locale}
			/>
			<AdminCheckpointContributions locale={locale} rows={contributions} />
		</div>
	)
}
