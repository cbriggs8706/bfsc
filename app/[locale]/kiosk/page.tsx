// app/[locale]/kiosk/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { IdentifyResponse } from '@/app/api/kiosk/identify/route'
import { PersonSummary, OnShiftConsultant, Purpose } from '@/types/kiosk'
import { IdentifyStep } from '@/components/kiosk/IdentifyStep'
import { NewPersonStep } from '@/components/kiosk/NewPersonStep'
import { ShiftStep } from '@/components/kiosk/ShiftStep'
import { ConsultantsStep } from '@/components/kiosk/ConsultantsStep'
import { VisitStep } from '@/components/kiosk/VisitStep'
import { RoleChoiceStep } from '@/components/kiosk/RoleChoiceStep'
import { CheckoutStep } from '@/components/kiosk/CheckoutStep'
import { NotFoundStep } from '@/components/kiosk/NotFoundStep'
import { Announcement } from '@/db'
import { CertificateSummary } from '@/types/training'

export default function KioskPage() {
	const [step, setStep] = useState<
		| 'identify'
		| 'choosePerson'
		| 'notFound'
		| 'newPerson'
		| 'roleChoice'
		| 'visit'
		| 'shift'
		| 'consultants'
		| 'actionChoice'
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
	const [matches, setMatches] = useState<PersonSummary[]>([])
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
	const [onShiftConsultants, setOnShiftConsultants] = useState<
		OnShiftConsultant[]
	>([])

	// New person form
	const [newName, setNewName] = useState('')
	const [newEmail, setNewEmail] = useState('')
	const [newPhone, setNewPhone] = useState('')
	const [faiths, setFaiths] = useState<{ id: string; name: string }[]>([])
	const [wards, setWards] = useState<
		{
			stakeId: string
			stakeName: string
			wards: { id: string; name: string }[]
		}[]
	>([])
	const [positions, setPositions] = useState<{ id: string; name: string }[]>([])
	const [faithId, setFaithId] = useState('')
	const [wardId, setWardId] = useState('')
	const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([])
	const [announcements, setAnnouncements] = useState<Announcement[]>([])
	const [certificatesByUser, setCertificatesByUser] = useState<
		Record<string, CertificateSummary[]>
	>({})

	// ──────────────────────────────
	// LOAD WARDS
	// ──────────────────────────────
	// Load faiths once
	useEffect(() => {
		fetch('/api/faiths')
			.then((r) => r.json())
			.then((d) => setFaiths(d.faiths))
	}, [])

	// Load wards when faith changes
	useEffect(() => {
		if (!faithId) return

		fetch(`/api/faiths/wards?faithId=${faithId}`)
			.then((r) => r.json())
			.then((d) => setWards(d.wards))
	}, [faithId])

	// Load positions once
	useEffect(() => {
		fetch('/api/faiths/positions')
			.then((r) => r.json())
			.then((d) => setPositions(d.positions))
	}, [])

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
			setStep('notFound')
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

	// New but don't think it's working
	// 	setSelectedPerson(data.person)
	// 	data.person.isConsultant
	// 		? setStep('roleChoice')
	// 		: (await loadPurposes(), setStep('visit'))
	// }

	// ──────────────────────────────
	// CREATE PERSON (guest or profile)
	// ──────────────────────────────
	const createPerson = async (wantsPasscode: boolean) => {
		const res = await fetch('/api/kiosk/people', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fullName: newName,
				email: wantsPasscode ? newEmail : null,
				phone: wantsPasscode ? newPhone : null,

				faithId: wantsPasscode ? faithId : undefined,
				wardId: wantsPasscode ? wardId : undefined,
				positionIds: wantsPasscode ? selectedPositionIds : undefined,

				wantsPasscode,
			}),
		})

		const data = await res.json()
		setSelectedPerson(data.person)

		if (data.passcode) {
			setServerMessage(`Your new fast check-in code is ${data.passcode}`)
		}

		await loadPurposes()
		setStep('visit')
	}

	// ──────────────────────────────
	// VISIT SUBMIT
	// ──────────────────────────────

	const handleSubmitVisit = async (purposeId: number) => {
		if (!selectedPerson) return

		const res = await fetch('/api/kiosk/visit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personId: selectedPerson.id,
				userId: selectedPerson.userId,
				purposeId,
				mailingListOptIn: mailingOptIn,
			}),
		})

		if (!res.ok) {
			setServerMessage('Sorry, something went wrong recording your visit.')
			return
		}

		setServerMessage(null)
		setStep('consultants')
	}

	// ──────────────────────────────
	// VISIT SUBMIT
	// ──────────────────────────────

	const handleSubmitShift = async () => {
		console.log(expectedDeparture)
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
		setStep('consultants')
	}

	// ──────────────────────────────
	// RESET
	// ──────────────────────────────

	const resetForm = () => {
		setStep('identify')
		setInput('')
		setSuggestions([])
		setMatches([])
		setSelectedPerson(null)
		setMailingOptIn(false)
		setExpectedDeparture('')
		setNewName('')
		setNewEmail('')
		// setWantsPasscode(true)
		setNewPhone('')
		setServerMessage(null)
	}

	useEffect(() => {
		;(async () => {
			const res = await fetch('/api/kiosk/on-shift', { cache: 'no-store' })
			if (!res.ok) return
			const data: {
				consultants: OnShiftConsultant[]
				certificatesByUser: Record<string, CertificateSummary[]>
			} = await res.json()
			setOnShiftConsultants(data.consultants)
			setCertificatesByUser(data.certificatesByUser)
		})()
	}, [])

	const refreshOnShift = async () => {
		const res = await fetch('/api/kiosk/on-shift', { cache: 'no-store' })
		if (!res.ok) return
		const data: {
			consultants: OnShiftConsultant[]
			certificatesByUser: Record<string, CertificateSummary[]>
		} = await res.json()

		setOnShiftConsultants(data.consultants)
		setCertificatesByUser(data.certificatesByUser)
	}

	useEffect(() => {
		if (step !== 'consultants') return
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
			<Card className="w-full max-w-md">
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
							onContinue={handleIdentify}
							onSelectSuggestion={(p) => {
								setSelectedPerson(p)
								setInput(p.fullName)
								setSuggestions([])
							}}
						/>
					)}

					{/* {step === 'choosePerson' && (
						<ChoosePersonStep
							matches={matches}
							onChoose={(p) => {
								setSelectedPerson(p)
								p.isConsultant
									? setStep('roleChoice')
									: (loadPurposes(), setStep('visit'))
							}}
							onCreateNew={() => setStep('newPerson')}
						/>
					)} */}

					{step === 'notFound' && (
						<NotFoundStep
							name={newName}
							onGuest={() => createPerson(false)}
							onCreateProfile={() => setStep('newPerson')}
						/>
					)}

					{step === 'newPerson' && (
						<NewPersonStep
							name={newName}
							email={newEmail}
							phone={newPhone}
							faithId={faithId}
							wardId={wardId}
							selectedPositionIds={selectedPositionIds}
							faiths={faiths}
							wards={wards}
							positions={positions}
							setFaithId={setFaithId}
							setWardId={setWardId}
							setSelectedPositionIds={setSelectedPositionIds}
							setEmail={setNewEmail}
							setPhone={setNewPhone}
							onSubmit={() => createPerson(true)}
						/>
					)}

					{step === 'visit' && selectedPerson && (
						<VisitStep
							person={selectedPerson}
							purposes={purposes}
							onSubmit={handleSubmitVisit}
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
							onCheckout={() => setStep('checkout')}
						/>
					)}

					{/* STEP: CHECKOUT */}

					{step === 'checkout' && selectedPerson && (
						<CheckoutStep person={selectedPerson} onDone={resetForm} />
					)}

					{/* STEP: CONSULTANTS */}

					{step === 'consultants' && (
						<ConsultantsStep
							announcements={announcements}
							consultants={onShiftConsultants}
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
						<>
							<p className="text-center text-xl text-muted-foreground">
								{serverMessage}.
							</p>
							<p className="text-center text-md text-muted-foreground">
								You&apos;ll be able to view this code later when you login and
								access your dashboard.
							</p>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
