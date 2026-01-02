'use client'

import { useState, useTransition, useMemo } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { updateAppSettings } from '@/lib/actions/app-settings'
import { TimeFormat } from '@/types/shifts'
import { useRouter } from 'next/navigation'

type Props = {
	initialTimeZone: string
	initialTimeFormat: TimeFormat
	initialDateFormat: string
}

export const TIME_ZONES = [
	// 🇺🇸 North America
	'America/New_York', // Eastern
	'America/Chicago', // Central
	'America/Denver', // Mountain
	'America/Los_Angeles', // Pacific
	'America/Phoenix', // No DST
	'America/Anchorage', // Alaska
	'Pacific/Honolulu', // Hawaii

	// 🇨🇦 Canada
	'America/Toronto',
	'America/Vancouver',

	// 🇲🇽 Latin America
	'America/Mexico_City',
	'America/Sao_Paulo',
	'America/Argentina/Buenos_Aires',
	'America/Santiago',

	// 🇬🇧🇪🇺 Europe
	'Europe/London',
	'Europe/Dublin',
	'Europe/Paris',
	'Europe/Berlin',
	'Europe/Rome',
	'Europe/Madrid',
	'Europe/Amsterdam',
	'Europe/Warsaw',
	'Europe/Helsinki',
	'Europe/Athens',
	'Europe/Moscow',

	// 🇿🇦 Africa
	'Africa/Cairo',
	'Africa/Nairobi',
	'Africa/Johannesburg',
	'Africa/Lagos',

	// 🇮🇱 Middle East
	'Asia/Jerusalem',
	'Asia/Dubai',
	'Asia/Riyadh',
	'Asia/Tehran',

	// 🇮🇳 South Asia
	'Asia/Kolkata', // India (half-hour!)
	'Asia/Kathmandu', // 45-minute offset (important edge case)

	// 🇨🇳 East Asia
	'Asia/Shanghai',
	'Asia/Hong_Kong',
	'Asia/Tokyo',
	'Asia/Seoul',

	// 🇹🇭 Southeast Asia
	'Asia/Bangkok',
	'Asia/Singapore',
	'Asia/Jakarta',

	// 🇦🇺🇳🇿 Oceania
	'Australia/Sydney',
	'Australia/Adelaide', // half-hour DST
	'Australia/Perth',
	'Pacific/Auckland',

	// 🌍 Neutral / technical
	'UTC',
]

export const DATE_FORMATS = [
	// 📜 Genealogy / historical
	{
		value: 'd MMM yyyy',
		label: '6 Jan 1942 (Genealogy standard)',
	},

	// 🇺🇸 United States
	{
		value: 'MMM d, yyyy',
		label: 'Jan 6, 1942 (US)',
	},
	{
		value: 'MM/dd/yyyy',
		label: '01/06/1942 (US numeric)',
	},

	// 🇬🇧🇪🇺 Europe / International
	{
		value: 'dd/MM/yyyy',
		label: '06/01/1942 (UK / EU)',
	},
	{
		value: 'dd.MM.yyyy',
		label: '06.01.1942 (Central Europe)',
	},

	// 🌍 ISO / archival / databases
	{
		value: 'yyyy-MM-dd',
		label: '1942-01-06 (ISO / archival)',
	},

	// 📚 Long-form (human readable)
	{
		value: 'EEEE, d MMMM yyyy',
		label: 'Tuesday, 6 January 1942',
	},
]

export const TIME_FORMATS: {
	value: TimeFormat
	label: string
}[] = [
	{
		value: 'h:mm a',
		label: '4:00 PM',
	},
	{
		value: 'h a',
		label: '4 PM',
	},
	{
		value: 'hh:mm a',
		label: '04:00 PM',
	},
	{
		value: 'H:mm',
		label: '16:00',
	},
	{
		value: 'HH:mm',
		label: '16:00 (24-hour padded)',
	},
]

export function CenterTimeSettings({
	initialTimeZone,
	initialTimeFormat,
	initialDateFormat,
}: Props) {
	const router = useRouter()
	const [timeZone, setTimeZone] = useState(initialTimeZone)
	const [timeFormat, setTimeFormat] = useState<TimeFormat>(initialTimeFormat)
	const [dateFormat, setDateFormat] = useState(initialDateFormat)

	const [pending, startTransition] = useTransition()

	const now = new Date()

	const preview = useMemo(() => {
		return `${format(now, dateFormat)} · ${format(now, timeFormat)}`
	}, [dateFormat, timeFormat])

	function save() {
		startTransition(async () => {
			await updateAppSettings({
				timeZone,
				timeFormat,
				dateFormat,
			})
		})
		router.refresh()
	}

	return (
		<Card className="p-4 space-y-4">
			<h2 className="text-lg font-semibold">Center Time Settings</h2>

			<p className="text-sm text-muted-foreground">
				These settings control how dates and times are interpreted and displayed
				throughout the system.
			</p>

			{/* ================= Time Zone ================= */}
			<div className="space-y-1">
				<label className="text-sm font-medium">Time Zone</label>
				<Select value={timeZone} onValueChange={setTimeZone}>
					<SelectTrigger className="w-[320px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TIME_ZONES.map((tz) => (
							<SelectItem key={tz} value={tz}>
								{tz}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* ================= Time Format ================= */}
			<div className="space-y-1">
				<label className="text-sm font-medium">Time Format</label>
				<Select
					value={timeFormat}
					onValueChange={(v) => setTimeFormat(v as TimeFormat)}
				>
					<SelectTrigger className="w-60">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TIME_FORMATS.map((tf) => (
							<SelectItem key={tf.value} value={tf.value}>
								{tf.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* ================= Date Format ================= */}
			<div className="space-y-1">
				<label className="text-sm font-medium">Date Format</label>
				<Select value={dateFormat} onValueChange={setDateFormat}>
					<SelectTrigger className="w-[260px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DATE_FORMATS.map((d) => (
							<SelectItem key={d.value} value={d.value}>
								{d.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* ================= Preview ================= */}
			<div className="text-sm text-muted-foreground">
				Preview: <span className="font-medium text-foreground">{preview}</span>
			</div>

			<Button onClick={save} disabled={pending}>
				{pending ? 'Saving…' : 'Save changes'}
			</Button>
		</Card>
	)
}
