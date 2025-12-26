// components/resources/ResourcesForm.tsx
'use client'

import { useState } from 'react'
import { Resource } from '@/types/resource'
import { ResourceForm } from './ResourceForm'
import { ResourcesTable } from './ResourcesTable'
import { createResourceAction } from '@/app/actions/resource'

export function ResourcesClient({ resources }: { resources: Resource[] }) {
	const [items, setItems] = useState(resources)

	return (
		<>
			<ResourceForm
				submitLabel="Create resource"
				onSubmit={async (data) => {
					const r = await createResourceAction(data)
					setItems((prev) => [r, ...prev])
				}}
			/>

			<ResourcesTable resources={items} />
		</>
	)
}
