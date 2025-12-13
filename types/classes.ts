type Mode = 'create' | 'update'

type PresenterOption = { id: string; name: string | null; email: string }

type ClassSeriesFormProps = {
	mode: Mode
	locale: string
	requireApproval: boolean
	presenterOptions: PresenterOption[]

	initial?: {
		series: {
			id: string
			status: 'draft' | 'published'
			title: string
			description: string | null
			location: string
			zoomUrl: string | null
			recordingUrl: string | null
			coverImageUrl: string | null
			coverImagePath: string | null
			presenterIds: string[]
			links: { id: string; label: string; url: string }[]
		}
		sessions: Array<{
			id: string
			partNumber: number
			startsAt: string // ISO
			durationMinutes: number
			status: 'scheduled' | 'canceled'
			canceledReason: string | null

			// overrides
			titleOverride: string | null
			descriptionOverride: string | null
			locationOverride: string | null
			zoomUrlOverride: string | null
			recordingUrlOverride: string | null

			presenterIds: string[] // if empty => inherit
			links: { id: string; label: string; url: string }[] // if empty => inherit
			handouts: { id: string; fileName: string; publicUrl: string | null }[]
		}>
	}
}
