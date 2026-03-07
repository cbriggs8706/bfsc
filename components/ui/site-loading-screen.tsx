import { Spinner } from '@/components/ui/spinner'

type SiteLoadingScreenProps = {
	mode?: 'fullscreen' | 'content'
}

export function SiteLoadingScreen({
	mode = 'fullscreen',
}: SiteLoadingScreenProps) {
	const isContent = mode === 'content'

	return (
		<div
			className={`relative flex items-center justify-center overflow-hidden bg-background px-6 ${
				isContent ? 'min-h-[50vh] rounded-[calc(var(--radius)+0.5rem)]' : 'min-h-screen'
			}`}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-90"
				style={{
					backgroundImage:
						'radial-gradient(circle at top, var(--green-accent-soft) 0%, transparent 38%), radial-gradient(circle at bottom right, var(--blue-accent-soft) 0%, transparent 32%), linear-gradient(180deg, color-mix(in srgb, var(--background) 92%, var(--card) 8%) 0%, var(--background) 100%)',
				}}
			/>
			<div
				className={`relative flex items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-lg backdrop-blur-sm ${
					isContent ? 'h-20 w-20' : 'h-24 w-24'
				}`}
			>
				<div
					aria-hidden="true"
					className="absolute inset-2 rounded-full"
					style={{
						background:
							'radial-gradient(circle, color-mix(in srgb, var(--green-logo-soft) 72%, transparent) 0%, transparent 72%)',
						}}
					/>
				<Spinner
					className={`relative z-10 text-primary ${isContent ? 'size-8' : 'size-10'}`}
				/>
				<span className="sr-only">Loading page</span>
			</div>
		</div>
	)
}
