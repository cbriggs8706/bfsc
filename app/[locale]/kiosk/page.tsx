// app/[locale]/kiosk/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { IdentifyResponse } from '@/app/api/kiosk/identify/route'
import { PersonSummary, OnShiftWorker, Purpose } from '@/types/kiosk'
import { IdentifyStep } from '@/components/kiosk/IdentifyStep'
import { ShiftStep } from '@/components/kiosk/ShiftStep'
import { WorkersStep } from '@/components/kiosk/WorkersStep'
import { VisitStep } from '@/components/kiosk/VisitStep'
import { RoleChoiceStep } from '@/components/kiosk/RoleChoiceStep'
import { CheckoutStep } from '@/components/kiosk/CheckoutStep'
import { Announcement } from '@/db'
import { CertificateSummary } from '@/types/training'
import { OnScreenKeyboard } from '@/components/kiosk/OnScreenKeyboard'

export default function KioskPage() {
	const [step, setStep] = useState<
		| 'identify'
		| 'roleChoice'
		| 'visit'
		| 'shift'
		| 'workers'
		| 'checkout'
	>('identify')

	function generateTimeSlots(
		startHour = 9,
		endHour = 21,
		intervalMinutes = 30
	): string[] {
		const slots: string[] = []

		for (let h = startHour; h <= endHour; h++) {
			for (let m = 0; m < 60; m += intervalMinutes) {
				if (h === endHour && m > 0) break

				const hh = String(h).padStart(2, '0')
				const mm = String(m).padStart(2, '0')
				slots.push(`${hh}:${mm}`)
			}
		}

		return slots
	}

	const [input, setInput] = useState('')
	const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(
		null
	)
	const [purposes, setPurposes] = useState<Purpose[]>([])
	const [mailingOptIn, setMailingOptIn] = useState(false)
	const [expectedDeparture, setExpectedDeparture] = useState('')
	const [serverMessage, setServerMessage] = useState<string | null>(null)

	const [suggestions, setSuggestions] = useState<PersonSummary[]>([])
	const [searching, setSearching] = useState(false)
	const searchTimeout = useRef<NodeJS.Timeout | null>(null)
	const [timeSlots] = useState<string[]>(() => generateTimeSlots())
	const [onShiftWorkers, setOnShiftWorkers] = useState<OnShiftWorker[]>([])

	const [newName, setNewName] = useState('')
	const [announcements, setAnnouncements] = useState<Announcement[]>([])
	const [certificatesByUser, setCertificatesByUser] = useState<
		Record<string, CertificateSummary[]>
	>({})

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
		setServerMessage(null)

		if (/^\d{6}$/.test(value)) {
			setSuggestions([])
			handleIdentify()
			return
		}

		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current)
		}

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
	// LOAD PURPOSES
	// ──────────────────────────────

	const loadPurposes = async () => {
		if (purposes.length) return
		const res = await fetch('/api/kiosk/purposes')
		const data = await res.json()
		setPurposes(data.purposes)
	}

	// ──────────────────────────────
	// IDENTIFY
	// ──────────────────────────────
	const handleIdentify = async (person?: PersonSummary) => {
		setServerMessage(null)

		const payload = person
			? { id: person.id }
			: selectedPerson
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

		if (data.status === 'notFound') {
			if (/^\d{6}$/.test(input.trim())) {
				setServerMessage('Code not found. Try your name instead.')
				return
			}
			setNewName(data.suggestedName ?? input.trim())
			await loadPurposes()
			setStep('visit')
			return
		}

		if (data.status === 'multipleMatches') {
			setSuggestions(data.people)
			setServerMessage('Multiple matches found. Please tap your name.')
			setStep('identify')
			return
		}

		const foundPerson = data.person

		setSelectedPerson(foundPerson)
		setSuggestions([])

		if (foundPerson.isWorker) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
	}

	// ──────────────────────────────
	// CREATE PERSON (guest)
	// ──────────────────────────────
	const createGuestPerson = async (): Promise<PersonSummary | null> => {
		if (!newName.trim()) return null

		const res = await fetch('/api/kiosk/people', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fullName: newName,
				wantsPasscode: false,
			}),
		})

		if (!res.ok) return null

		const data = await res.json()
		return data.person as PersonSummary
	}

	// ──────────────────────────────
	// VISIT SUBMIT
	// ──────────────────────────────

	const handleSubmitVisit = async (purposeId: number) => {
		let person = selectedPerson

		if (!person && newName.trim()) {
			person = await createGuestPerson()
			if (person) {
				setSelectedPerson(person)
			}
		}

		if (!person) {
			setServerMessage('Please identify yourself first.')
			return
		}

		const res = await fetch('/api/kiosk/visit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personId: person.id,
				userId: person.userId,
				purposeId,
				mailingListOptIn: mailingOptIn,
			}),
		})

		if (!res.ok) {
			setServerMessage('Sorry, something went wrong recording your visit.')
			return
		}

		setServerMessage(null)
		setStep('workers')
	}

	// ──────────────────────────────
	// VISIT SUBMIT
	// ──────────────────────────────

	const handleSubmitShift = async () => {
		// console.log(expectedDeparture)
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
		setServerMessage(null)
		await refreshOnShift()
		setStep('workers')
	}

	// ──────────────────────────────
	// RESET
	// ──────────────────────────────

	const resetForm = () => {
		setStep('identify')
		setInput('')
		setSuggestions([])
		setSelectedPerson(null)
		setMailingOptIn(false)
		setExpectedDeparture('')
		setNewName('')
		setServerMessage(null)
	}

	useEffect(() => {
		;(async () => {
			const res = await fetch('/api/kiosk/on-shift', { cache: 'no-store' })
			if (!res.ok) return
			const data: {
				workers: OnShiftWorker[]
				certificatesByUser: Record<string, CertificateSummary[]>
			} = await res.json()
			setOnShiftWorkers(data.workers)
			setCertificatesByUser(data.certificatesByUser)
		})()
	}, [])

	const refreshOnShift = async () => {
		const res = await fetch('/api/kiosk/on-shift', { cache: 'no-store' })
		if (!res.ok) return
		const data: {
			workers: OnShiftWorker[]
			certificatesByUser: Record<string, CertificateSummary[]>
		} = await res.json()

		setOnShiftWorkers(data.workers)
		setCertificatesByUser(data.certificatesByUser)
	}

	useEffect(() => {
		if (step !== 'workers') return
		refreshOnShift()
	}, [step])

	useEffect(() => {
		;(async () => {
			const res = await fetch('/api/announcements', {
				cache: 'no-store',
			})
			if (!res.ok) return

			const data: { announcements: Announcement[] } = await res.json()
			setAnnouncements(data.announcements)
		})()
	}, [])

	// ──────────────────────────────
	// RENDER
	// ──────────────────────────────
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted">
			<Card className="w-full m-4">
				<CardHeader>
					<CardTitle className="text-center text-2xl">
						Family History Center Sign-In
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					{step === 'identify' && (
						<IdentifyStep
							input={input}
							suggestions={suggestions}
							searching={searching}
							onInputChange={handleInputChange}
							onSelectSuggestion={(p) => {
								setSelectedPerson(p)
								setInput(p.fullName)
								setSuggestions([])
								handleIdentify(p)
							}}
						/>
					)}

					<CardContent>
						{step === 'identify' && (
							<OnScreenKeyboard
								onKey={(char) => handleInputChange(input + char)}
								onBackspace={() => handleInputChange(input.slice(0, -1))}
								onClear={() => handleInputChange('')}
								onSpace={() => handleInputChange(`${input} `)}
								onContinue={() => handleIdentify()}
								canContinue={input.trim().length >= 2}
							/>
						)}
					</CardContent>

					{/* {step === 'choosePerson' && (
						<ChoosePersonStep
							matches={matches}
							onChoose={(p) => {
								setSelectedPerson(p)
								p.isWorker
									? setStep('roleChoice')
									: (loadPurposes(), setStep('visit'))
							}}
							onCreateNew={() => setStep('newPerson')}
						/>
					)} */}

					{step === 'visit' && (
						<VisitStep
							person={
								selectedPerson ?? {
									id: '',
									fullName: newName,
									userId: null,
									isWorker: false,
									hasPasscode: false,
								}
							}
							purposes={purposes}
							onSubmit={handleSubmitVisit}
						/>
					)}

					{/* STEP: ROLE CHOICE FOR WORKERS */}
					{step === 'roleChoice' && selectedPerson && (
						<RoleChoiceStep
							person={selectedPerson}
							onVisit={async () => {
								await loadPurposes()
								setStep('visit')
							}}
							onShift={() => setStep('shift')}
							onCheckout={() => setStep('checkout')}
						/>
					)}

					{/* STEP: CHECKOUT */}

					{step === 'checkout' && selectedPerson && (
						<CheckoutStep person={selectedPerson} onDone={resetForm} />
					)}

					{/* STEP: WORKERS */}

					{step === 'workers' && (
						<WorkersStep
							announcements={announcements}
							workers={onShiftWorkers}
							certificatesByUser={certificatesByUser}
							onDone={resetForm}
						/>
					)}

					{/* STEP: SHIFT */}

					{step === 'shift' && (
						<ShiftStep
							timeSlots={timeSlots}
							expectedDeparture={expectedDeparture}
							setExpectedDeparture={setExpectedDeparture}
							onSubmit={handleSubmitShift}
						/>
					)}

					{serverMessage && (
						<p className="text-center text-xl text-muted-foreground">
							{serverMessage}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
