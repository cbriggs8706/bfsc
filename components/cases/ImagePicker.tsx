// components/cases/ImagePicker.tsx
'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'

export function ImagePicker({ onAdd }: { onAdd: (file: File) => void }) {
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0]
					if (file) onAdd(file)
				}}
			/>
			<Button
				type="button"
				variant="outline"
				onClick={() => inputRef.current?.click()}
			>
				<Camera className="mr-2 h-4 w-4" />
				Add Photo
			</Button>
		</>
	)
}
