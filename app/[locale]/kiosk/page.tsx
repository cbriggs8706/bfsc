// app/[locale]/kiosk/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { IdentifyResponse } from '@/app/api/kiosk/identify/route'
import {
	PersonSummary,
	OnShiftConsultant,
	Purpose,
	KioskStep,
} from '@/types/kiosk'
import { IdentifyStep } from '@/components/kiosk/IdentifyStep'
import { ChoosePersonStep } from '@/components/kiosk/ChoosePersonStep'
import { NewPersonStep } from '@/components/kiosk/NewPersonStep'
import { ShiftStep } from '@/components/kiosk/ShiftStep'
import { ConsultantsStep } from '@/components/kiosk/ConsultantsStep'
import { VisitStep } from '@/components/kiosk/VisitStep'
import { RoleChoiceStep } from '@/components/kiosk/RoleChoiceStep'
import { ActionChoiceStep } from '@/components/kiosk/ActionChoiceStep'
import { CheckoutStep } from '@/components/kiosk/CheckoutStep'

export default function KioskPage() {
	const [step, setStep] = useState<
		| 'identify'
		| 'choosePerson'
		| 'newPerson'
		| 'roleChoice'
		| 'visit'
		| 'shift'
		| 'consultants'
		| 'actionChoice'
		| 'checkout'
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
	const [onShiftConsultants, setOnShiftConsultants] = useState<
		OnShiftConsultant[]
	>([])

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

		setServerMessage(null)
		setStep('actionChoice')
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

	useEffect(() => {
		;(async () => {
			const res = await fetch('/api/kiosk/on-shift', {
				cache: 'no-store',
			})
			if (!res.ok) return

			const data: { consultants: OnShiftConsultant[] } = await res.json()
			setOnShiftConsultants(data.consultants)
		})()
	}, [])

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
						<IdentifyStep
							input={input}
							suggestions={suggestions}
							searching={searching}
							onInputChange={handleInputChange}
							onContinue={handleIdentify}
							onSelectSuggestion={(p) => {
								setSelectedPerson(p)
								setInput(p.fullName)
							}}
						/>
					)}

					{/* STEP: MULTIPLE MATCHES */}
					{step === 'choosePerson' && (
						<ChoosePersonStep
							matches={matches}
							onChoose={handleChoosePerson}
							onCreateNew={() => setStep('newPerson')}
						/>
					)}

					{/* STEP: NEW PERSON */}
					{step === 'newPerson' && (
						<NewPersonStep
							newName={newName}
							newEmail={newEmail}
							wantsPasscode={wantsPasscode}
							setNewName={setNewName}
							setNewEmail={setNewEmail}
							setWantsPasscode={setWantsPasscode}
							onSubmit={handleCreateNewPerson}
						/>
					)}

					{/* STEP: ROLE CHOICE FOR CONSULTANTS */}
					{step === 'roleChoice' && selectedPerson && (
						<RoleChoiceStep
							person={selectedPerson}
							onVisit={async () => {
								await loadPurposes()
								setStep('visit')
							}}
							onShift={() => setStep('shift')}
						/>
					)}

					{/* STEP: VISIT */}
					{step === 'visit' && (
						<VisitStep
							purposes={purposes}
							selectedPurposeId={selectedPurposeId}
							mailingOptIn={mailingOptIn}
							setSelectedPurposeId={setSelectedPurposeId}
							setMailingOptIn={setMailingOptIn}
							onSubmit={handleSubmitVisit}
						/>
					)}

					{/* STEP: ACTION CHOICE */}

					{step === 'actionChoice' && selectedPerson && (
						<ActionChoiceStep
							person={selectedPerson}
							onResearch={() => setStep('consultants')}
							onCheckout={() => setStep('checkout')}
							onFinish={resetForm}
						/>
					)}

					{/* STEP: CHECKOUT */}

					{step === 'checkout' && selectedPerson && (
						<CheckoutStep
							person={selectedPerson}
							onDone={() => setStep('actionChoice')}
						/>
					)}

					{/* STEP: CONSULTANTS */}

					{step === 'consultants' && (
						<ConsultantsStep
							consultants={onShiftConsultants}
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
						<p className="mt-2 text-center text-sm text-muted-foreground">
							{serverMessage}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
