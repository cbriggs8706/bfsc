// app/[locale]/kiosk/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectValue,
	SelectItem,
} from '@/components/ui/select'
import type { IdentifyResponse } from '@/app/api/kiosk/identify/route'

type PersonSource = 'kiosk' | 'user'

type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isConsultant: boolean
	hasPasscode: boolean
	source?: PersonSource
}

type Purpose = {
	id: number
	name: string
}

export default function KioskPage() {
	const [step, setStep] = useState<
		'identify' | 'choosePerson' | 'newPerson' | 'roleChoice' | 'visit' | 'shift'
	>('identify')

	const [input, setInput] = useState('')
	const [matches, setMatches] = useState<PersonSummary[]>([])
	const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(
		null
	)
	const [purposes, setPurposes] = useState<Purpose[]>([])
	const [selectedPurposeId, setSelectedPurposeId] = useState<string>('')
	const [mailingOptIn, setMailingOptIn] = useState(false)
	const [expectedDeparture, setExpectedDeparture] = useState('')
	const [newName, setNewName] = useState('')
	const [newEmail, setNewEmail] = useState('')
	const [wantsPasscode, setWantsPasscode] = useState(true)
	const [serverMessage, setServerMessage] = useState<string | null>(null)

	const [suggestions, setSuggestions] = useState<PersonSummary[]>([])
	const [searching, setSearching] = useState(false)
	const searchTimeout = useRef<NodeJS.Timeout | null>(null)
	const [timeSlots, setTimeSlots] = useState<string[]>([])

	useEffect(() => {
		if (step !== 'shift') return

		let isMounted = true

		;(async () => {
			const res = await fetch('/api/kiosk/hours/today')
			const data = await res.json()
			if (!isMounted) return

			if (data.isClosed) {
				setTimeSlots([])
				return
			}

			const now = new Date()
			const [closeHr, closeMin] = data.closesAt.split(':').map(Number)

			const closingTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				closeHr,
				closeMin
			)

			const slots: string[] = []
			const cursor = new Date(now)

			// Round UP to the next 15-min interval
			const remainder = 15 - (cursor.getMinutes() % 15)
			cursor.setMinutes(cursor.getMinutes() + remainder)
			cursor.setSeconds(0)
			cursor.setMilliseconds(0)

			while (cursor < closingTime) {
				slots.push(cursor.toTimeString().slice(0, 5)) // HH:MM (24-hour)
				cursor.setMinutes(cursor.getMinutes() + 15)
			}

			setTimeSlots(slots)
		})()

		return () => {
			isMounted = false
		}
	}, [step])

	// ──────────────────────────────
	// LIVE SEARCH
	// ──────────────────────────────

	const performSearch = async (query: string) => {
		const res = await fetch(`/api/kiosk/search?q=${encodeURIComponent(query)}`)
		if (!res.ok) return
		const data: { people: PersonSummary[] } = await res.json()
		setSuggestions(data.people)
	}

	const handleInputChange = (value: string) => {
		setInput(value)
		setSelectedPerson(null)

		if (searchTimeout.current) clearTimeout(searchTimeout.current)

		if (value.length < 2) {
			setSuggestions([])
			return
		}

		searchTimeout.current = setTimeout(async () => {
			setSearching(true)
			await performSearch(value)
			setSearching(false)
		}, 250)
	}

	// ──────────────────────────────
	// IDENTIFY HANDLER (Continue)
	// ──────────────────────────────

	const handleIdentify = async () => {
		setServerMessage(null)

		const payload: { id?: string; input?: string } = selectedPerson
			? { id: selectedPerson.id }
			: { input }

		const res = await fetch('/api/kiosk/identify', {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: { 'Content-Type': 'application/json' },
		})

		if (!res.ok) {
			setServerMessage('Sorry, something went wrong. Please try again.')
			return
		}

		const data: IdentifyResponse = await res.json()
		console.log('IDENTIFY RESPONSE', data)

		if (data.status === 'notFound') {
			setNewName(data.suggestedName ?? input.trim())
			setStep('newPerson')
			return
		}

		if (data.status === 'multipleMatches') {
			setMatches(data.people)
			setStep('choosePerson')
			return
		}

		// foundSingle
		const person = data.person
		setSelectedPerson(person)
		setSuggestions([])

		if (person.isConsultant) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
	}

	// ──────────────────────────────
	// LOAD PURPOSES
	// ──────────────────────────────

	const loadPurposes = async () => {
		if (purposes.length > 0) return
		const res = await fetch('/api/kiosk/purposes')
		const data = await res.json()
		setPurposes(data.purposes as Purpose[])
	}

	// ──────────────────────────────
	// CHOOSE PERSON FROM MULTIPLE
	// ──────────────────────────────

	const handleChoosePerson = async (person: PersonSummary) => {
		setSelectedPerson(person)
		if (person.isConsultant) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
	}

	// ──────────────────────────────
	// NEW PERSON FLOW
	// ──────────────────────────────

	const handleCreateNewPerson = async () => {
		const res = await fetch('/api/kiosk/people', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fullName: newName,
				email: newEmail || undefined,
				wantsPasscode,
			}),
		})
		const data: { person: PersonSummary; passcode?: string } = await res.json()

		setSelectedPerson(data.person)

		if (data.passcode) {
			setServerMessage(`Your fast login code is ${data.passcode}`)
		}

		if (data.person.isConsultant) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
	}

	// ──────────────────────────────
	// VISIT SUBMIT
	// ──────────────────────────────

	const handleSubmitVisit = async () => {
		if (!selectedPerson) return
		const res = await fetch('/api/kiosk/visit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personId: selectedPerson.id,
				userId: selectedPerson.userId,
				purposeId: selectedPurposeId ? Number(selectedPurposeId) : null,
				mailingListOptIn: mailingOptIn,
			}),
		})

		if (!res.ok) {
			setServerMessage('Sorry, something went wrong recording your visit.')
			return
		}

		setServerMessage('Thanks! You are signed in.')
		resetForm()
	}

	// ──────────────────────────────
	// SHIFT SUBMIT
	// ──────────────────────────────

	const handleSubmitShift = async () => {
		if (!selectedPerson || !expectedDeparture) return

		const res = await fetch('/api/kiosk/shift', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personId: selectedPerson.id,
				expectedDepartureAt: expectedDeparture,
			}),
		})

		if (!res.ok) {
			setServerMessage('Sorry, something went wrong starting your shift.')
			return
		}

		setServerMessage('Your shift has been logged.')
		resetForm()
	}

	const resetForm = () => {
		setStep('identify')
		setInput('')
		setSuggestions([])
		setMatches([])
		setSelectedPerson(null)
		setSelectedPurposeId('')
		setMailingOptIn(false)
		setExpectedDeparture('')
		setNewName('')
		setNewEmail('')
		setWantsPasscode(true)
	}

	// ──────────────────────────────
	// RENDER
	// ──────────────────────────────

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl">
						Family History Center Sign-In
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* STEP: IDENTIFY */}
					{step === 'identify' && (
						<div className="space-y-3">
							<Label htmlFor="input">
								Enter your <strong>name</strong> or{' '}
								<strong>6-digit code</strong>
							</Label>

							<Input
								id="input"
								value={input}
								onChange={(e) => handleInputChange(e.target.value)}
								autoFocus
							/>

							{/* Suggestions list */}
							{suggestions.length > 0 && (
								<div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
									{suggestions.map((s) => (
										<Button
											key={s.id}
											className="w-full justify-start"
											variant={
												selectedPerson && selectedPerson.id === s.id
													? 'default'
													: 'secondary'
											}
											onClick={() => {
												setSelectedPerson(s)
												setInput(s.fullName)
											}}
										>
											{s.fullName}
											{s.source === 'kiosk' && s.hasPasscode && (
												<span className="ml-2 text-xs text-muted-foreground">
													(fast login)
												</span>
											)}
										</Button>
									))}
								</div>
							)}

							{searching && (
								<p className="text-sm text-muted-foreground">Searching…</p>
							)}

							<Button className="w-full mt-2" onClick={handleIdentify}>
								Continue
							</Button>
						</div>
					)}

					{/* STEP: MULTIPLE MATCHES */}
					{step === 'choosePerson' && (
						<div className="space-y-3">
							<p>We found several matches. Please choose your name:</p>
							<div className="space-y-2 max-h-64 overflow-y-auto">
								{matches.map((p) => (
									<Button
										key={p.id}
										variant="outline"
										className="w-full justify-between"
										onClick={() => handleChoosePerson(p)}
									>
										<span>{p.fullName}</span>
										{p.isConsultant && (
											<span className="text-xs text-muted-foreground">
												Consultant
											</span>
										)}
									</Button>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full"
								onClick={() => setStep('newPerson')}
							>
								I don&apos;t see my name
							</Button>
						</div>
					)}

					{/* STEP: NEW PERSON */}
					{step === 'newPerson' && (
						<div className="space-y-3">
							<p>
								Welcome! Let&apos;s save your name for faster sign-in next time.
							</p>
							<div>
								<Label htmlFor="newName">Name</Label>
								<Input
									id="newName"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="newEmail">Email (optional)</Label>
								<Input
									id="newEmail"
									type="email"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
								/>
							</div>
							<div className="flex items-center gap-2">
								<input
									id="wantsPasscode"
									type="checkbox"
									checked={wantsPasscode}
									onChange={(e) => setWantsPasscode(e.target.checked)}
								/>
								<Label htmlFor="wantsPasscode">
									Give me a 6-digit code for faster login
								</Label>
							</div>
							<Button className="w-full" onClick={handleCreateNewPerson}>
								Save &amp; Continue
							</Button>
						</div>
					)}

					{/* STEP: ROLE CHOICE FOR CONSULTANTS */}
					{step === 'roleChoice' && selectedPerson && (
						<div className="space-y-3">
							<p className="text-center text-lg font-semibold">
								Hi {selectedPerson.fullName}!
							</p>
							<p className="text-center">
								Are you here <strong>for your shift</strong> or for{' '}
								<strong>your own research</strong> today?
							</p>
							<Button
								className="w-full"
								onClick={async () => {
									await loadPurposes()
									setStep('visit')
								}}
							>
								I&apos;m visiting as a patron
							</Button>
							<Button
								className="w-full"
								variant="outline"
								onClick={() => setStep('shift')}
							>
								I&apos;m here for my shift
							</Button>
						</div>
					)}

					{/* STEP: VISIT */}
					{step === 'visit' && (
						<div className="space-y-3">
							<div>
								<Label>Reason for your visit today</Label>
								<Select
									value={selectedPurposeId}
									onValueChange={(value) => setSelectedPurposeId(value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Choose one" />
									</SelectTrigger>
									<SelectContent>
										{purposes.map((p) => (
											<SelectItem key={p.id} value={String(p.id)}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<input
									id="mailingOptIn"
									type="checkbox"
									checked={mailingOptIn}
									onChange={(e) => setMailingOptIn(e.target.checked)}
								/>
								<Label htmlFor="mailingOptIn">
									I&apos;d like to receive emails about classes and events
								</Label>
							</div>
							<Button className="w-full" onClick={handleSubmitVisit}>
								Sign me in
							</Button>
						</div>
					)}

					{/* STEP: SHIFT */}

					{step === 'shift' && (
						<div className="space-y-4">
							<p className="text-center text-lg font-semibold">
								What time do you expect to leave today?
							</p>

							{/* 15-minute interval buttons */}
							<div className="max-h-64 overflow-y-auto grid grid-cols-3 gap-2">
								{timeSlots.map((t) => (
									<Button
										key={t}
										variant={expectedDeparture === t ? 'default' : 'outline'}
										onClick={() => setExpectedDeparture(t)}
									>
										{t}
									</Button>
								))}
							</div>

							<Button
								className="w-full mt-4"
								disabled={!expectedDeparture}
								onClick={handleSubmitShift}
							>
								Start my shift
							</Button>

							{/* Optional fallback input (remove if not wanted) */}
							{/* 
		<Input
			type="time"
			value={expectedDeparture}
			onChange={(e) => setExpectedDeparture(e.target.value)}
		/>
		*/}
						</div>
					)}

					{serverMessage && (
						<p className="mt-2 text-center text-sm text-muted-foreground">
							{serverMessage}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
