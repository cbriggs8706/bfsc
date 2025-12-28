import { Label } from '@/components/ui/label'

type Props = {
	children: React.ReactNode
}

export function Required({ children }: Props) {
	return (
		<Label className="flex items-center gap-1">
			{children}
			<span className="text-red-600">*</span>
		</Label>
	)
}
