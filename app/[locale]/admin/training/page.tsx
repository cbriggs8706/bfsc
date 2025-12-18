import { redirect } from 'next/navigation'

type Props = {
	params: { locale: string }
}

export default async function TrainingAdminPage({ params }: Props) {
	const { locale } = await params
	redirect(`/${locale}/admin/training/courses`)
}
