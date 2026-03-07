'use client'

import { createElement, useMemo, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CMS_ICON_NAMES, resolveCmsMenuIcon } from '@/lib/cms-menu-icons'

export function LucideIconPicker({
	value,
	onChange,
}: {
	value: string
	onChange: (value: string) => void
}) {
	const [open, setOpen] = useState(false)
	const currentName = value || 'Files'

	const iconNames = useMemo(() => CMS_ICON_NAMES, [])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					<span className="flex items-center gap-2 truncate">
						{createElement(resolveCmsMenuIcon(currentName), {
							className: 'size-4',
						})}
						<span className="truncate">{currentName}</span>
					</span>
					<ChevronsUpDown className="size-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[320px] p-0">
				<Command>
					<CommandInput placeholder="Search Lucide icons..." />
					<CommandList className="max-h-[320px]">
						<CommandEmpty>No icon found.</CommandEmpty>
						{iconNames.map((iconName) => {
							return (
								<CommandItem
									key={iconName}
									value={iconName}
									onSelect={() => {
										onChange(iconName)
										setOpen(false)
									}}
								>
									{createElement(resolveCmsMenuIcon(iconName), {
										className: 'size-4',
									})}
									<span>{iconName}</span>
								</CommandItem>
							)
						})}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
