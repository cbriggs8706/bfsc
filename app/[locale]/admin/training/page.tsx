// app/[locale]/admin/training/page.tsx
import { GenieGreenieAssignmentPanel } from '@/components/admin/training/GenieGreenieAssignmentPanel'

type Props = {
	params: { locale: string }
}

export default async function TrainingAdminPage({ params }: Props) {
	const { locale } = await params

	return <GenieGreenieAssignmentPanel locale={locale} />
}
