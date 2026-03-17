// app/[locale]/kiosk/page.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { IdentifyResponse } from '@/app/api/kiosk/identify/route'
import { PersonSummary, OnShiftWorker, Purpose } from '@/types/kiosk'
import { IdentifyStep } from '@/components/kiosk/IdentifyStep'
import { ShiftStep } from '@/components/kiosk/ShiftStep'
import { WorkersStep } from '@/components/kiosk/WorkersStep'
import { VisitStep } from '@/components/kiosk/VisitStep'
import { RoleChoiceStep } from '@/components/kiosk/RoleChoiceStep'
import { CheckoutStep } from '@/components/kiosk/CheckoutStep'
import { VisitGroupDetailsStep } from '@/components/kiosk/VisitGroupDetailsStep'
import { MissionariesStep } from '@/components/kiosk/MissionariesStep'
import { WelcomeStep } from '@/components/kiosk/WelcomeStep'
import { Announcement } from '@/db'
import { CertificateSummary } from '@/types/training'
import { OnScreenKeyboard } from '@/components/kiosk/OnScreenKeyboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeToNewsletter } from '@/app/actions/newsletter/subscribe'

type VisitReason = 'patron' | 'training' | 'group'
type Faith = { id: string; name: string }
type Stake = { id: string; name: string }
type WardGroup = {
	stakeId: string
	stakeName: string
	wards: { id: string; name: string }[]
}

export default function KioskPage() {
	const isMissionariesName = (value: string | null | undefined) =>
		value?.trim().toLowerCase() === 'missionaries'

	const [step, setStep] = useState<
		| 'identify'
		| 'newsletterSignup'
		| 'newsletterSuccess'
		| 'roleChoice'
		| 'missionaries'
		| 'visitGroupDetails'
		| 'visit'
		| 'welcome'
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
	const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
	const [visitReason, setVisitReason] = useState<VisitReason>('patron')
	const [purposes, setPurposes] = useState<Purpose[]>([])
	const [mailingOptIn, setMailingOptIn] = useState(false)
	const [expectedDeparture, setExpectedDeparture] = useState('')
	const [serverMessage, setServerMessage] = useState<string | null>(null)
	const [partOfFaithGroup, setPartOfFaithGroup] = useState<boolean | null>(
		null
	)
	const [faiths, setFaiths] = useState<Faith[]>([])
	const [faithId, setFaithId] = useState('')
	const [stakes, setStakes] = useState<Stake[]>([])
	const [stakeId, setStakeId] = useState('')
	const [wardGroups, setWardGroups] = useState<WardGroup[]>([])
	const [wardId, setWardId] = useState('')
	const [groupSize, setGroupSize] = useState(0)
	const [welcomeCountdown, setWelcomeCountdown] = useState(10)
	const [workersRedirectCountdown, setWorkersRedirectCountdown] = useState(15)

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
	const [newsletterEmail, setNewsletterEmail] = useState('')
	const [newsletterSubmitting, setNewsletterSubmitting] = useState(false)
	const [newsletterError, setNewsletterError] = useState<string | null>(null)
	const [newsletterSuccessMessage, setNewsletterSuccessMessage] =
		useState<string>('Check your email to confirm your subscription.')
	const [newsletterCountdown, setNewsletterCountdown] = useState(5)
	const [visitSubmitting, setVisitSubmitting] = useState(false)
	const visitSubmitLockRef = useRef(false)

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
		if (!editingPersonId) {
			setSelectedPerson(null)
		}
		setServerMessage(null)

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

	const handleEditName = async () => {
		const currentName =
			selectedPerson?.fullName || newName.trim() || input.trim()
		if (!currentName) {
			setStep('identify')
			return
		}

		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current)
		}

		setSelectedPerson(null)
		setNewName('')
		setEditingPersonId(selectedPerson?.id ?? null)
		setSuggestions([])
		setServerMessage(null)
		setInput(currentName)
		setStep('identify')

		if (currentName.length < 2) return

		setSearching(true)
		try {
			await performSearch(currentName)
		} finally {
			setSearching(false)
		}
	}

	const handleContinueFromIdentify = async () => {
		if (!editingPersonId) {
			await handleIdentify()
			return
		}

		const editedName = input.trim()
		if (!editedName) return

		setServerMessage(null)

		const res = await fetch(`/api/kiosk/people/${editingPersonId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fullName: editedName }),
		})

		if (!res.ok) {
			setServerMessage('Sorry, we could not update the spelling just now.')
			return
		}

		const data: { person: PersonSummary } = await res.json()
		setSelectedPerson(data.person)
		setInput(data.person.fullName)
		setNewName(data.person.fullName)
		setEditingPersonId(null)
		setSuggestions([])
		setStep('roleChoice')
	}

	const handleHardRefresh = async () => {
		try {
			if (typeof window !== 'undefined') {
				window.localStorage.clear()
				window.sessionStorage.clear()
			}

			if (typeof caches !== 'undefined') {
				const cacheKeys = await caches.keys()
				await Promise.all(cacheKeys.map((key) => caches.delete(key)))
			}
		} finally {
			window.location.reload()
		}
	}

	const handleNewsletterSignup = async () => {
		setNewsletterSubmitting(true)
		setNewsletterError(null)

		try {
			const result = await subscribeToNewsletter(newsletterEmail)

			if (result.status === 'error') {
				setNewsletterError(result.message)
				return
			}

			setNewsletterSuccessMessage(
				result.status === 'already-confirmed'
					? 'This email is already subscribed to our newsletter.'
					: 'Check your email to confirm your subscription.'
			)
			setNewsletterCountdown(5)
			setStep('newsletterSuccess')
		} finally {
			setNewsletterSubmitting(false)
		}
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

	const loadFaiths = async () => {
		if (faiths.length) return
		const res = await fetch('/api/faiths')
		if (!res.ok) return
		const data: { faiths: Faith[] } = await res.json()
		setFaiths(data.faiths)
	}

	const loadLdsUnits = async (selectedFaithId: string) => {
		if (!selectedFaithId) return
		const [stakesRes, wardsRes] = await Promise.all([
			fetch(`/api/faiths/stakes?faithId=${encodeURIComponent(selectedFaithId)}`),
			fetch(`/api/faiths/wards?faithId=${encodeURIComponent(selectedFaithId)}`),
		])

		if (stakesRes.ok) {
			const stakesData: { stakes: Stake[] } = await stakesRes.json()
			setStakes(stakesData.stakes)
		}

		if (wardsRes.ok) {
			const wardsData: { wards: WardGroup[] } = await wardsRes.json()
			setWardGroups(wardsData.wards)
		}
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
			const suggestedName = data.suggestedName ?? input.trim()
			setNewName(suggestedName)
			setVisitReason('patron')
			setPartOfFaithGroup(null)
			setFaithId('')
			setStakeId('')
			setWardId('')
			setGroupSize(0)
			if (isMissionariesName(suggestedName)) {
				setVisitReason('group')
				setStep('missionaries')
				return
			}
			setStep('roleChoice')
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

		setVisitReason('patron')
		setPartOfFaithGroup(null)
		setFaithId('')
		setStakeId('')
		setWardId('')
		setGroupSize(0)
		if (isMissionariesName(foundPerson.fullName)) {
			setVisitReason('group')
			setStep('missionaries')
			return
		}
		setStep('roleChoice')
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

	const submitVisitLog = async (purposeId?: number | null) => {
		if (visitSubmitLockRef.current) return false
		visitSubmitLockRef.current = true
		setVisitSubmitting(true)

		let person = selectedPerson

		try {
			if (!person && newName.trim()) {
				person = await createGuestPerson()
				if (person) {
					setSelectedPerson(person)
				}
			}

			if (!person) {
				setServerMessage('Please identify yourself first.')
				return false
			}

			const selectedFaith = faiths.find((faith) => faith.id === faithId)
			const selectedStake = stakes.find((stake) => stake.id === stakeId)
			const selectedWard =
				wardGroups
					.find((group) => group.stakeId === stakeId)
					?.wards.find((ward) => ward.id === wardId) ?? null

			const visitMeta = {
				visitReason,
				partOfFaithGroup,
				faithGroupName: selectedFaith?.name ?? null,
				stakeName: selectedStake?.name ?? null,
				wardName: selectedWard?.name ?? null,
				peopleCameWithVisitor: groupSize,
			}

			const res = await fetch('/api/kiosk/visit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					personId: person.id,
					userId: person.userId,
					purposeId: purposeId ?? null,
					mailingListOptIn: mailingOptIn,
					visitMeta,
				}),
			})

			if (!res.ok) {
				setServerMessage('Sorry, something went wrong recording your visit.')
				return false
			}

			setServerMessage(null)
			return true
		} finally {
			visitSubmitLockRef.current = false
			setVisitSubmitting(false)
		}
	}

	const handleSubmitVisit = async (purposeId: number) => {
		const success = await submitVisitLog(purposeId)
		if (!success) return

		setWorkersRedirectCountdown(15)
		setStep('workers')
	}

	const handleSubmitTrainingOrGroupVisit = async () => {
		const success = await submitVisitLog(null)
		if (!success) return

		setWelcomeCountdown(10)
		setStep('welcome')
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
		setWorkersRedirectCountdown(15)
		setStep('workers')
	}

	// ──────────────────────────────
	// RESET
	// ──────────────────────────────

	const resetForm = useCallback(() => {
		setStep('identify')
		setInput('')
		setSuggestions([])
		setSelectedPerson(null)
		setEditingPersonId(null)
		setVisitReason('patron')
		setMailingOptIn(false)
		setExpectedDeparture('')
		setNewName('')
		setPartOfFaithGroup(null)
		setFaithId('')
		setStakes([])
		setStakeId('')
		setWardGroups([])
		setWardId('')
		setGroupSize(0)
		setWelcomeCountdown(10)
		setNewsletterEmail('')
		setNewsletterSubmitting(false)
		setNewsletterError(null)
		setNewsletterSuccessMessage(
			'Check your email to confirm your subscription.'
		)
		setNewsletterCountdown(5)
		setVisitSubmitting(false)
		visitSubmitLockRef.current = false
		setWorkersRedirectCountdown(15)
		setServerMessage(null)
	}, [])

	const selectedFaith = faiths.find((faith) => faith.id === faithId)
	const isLdsFaith =
		selectedFaith?.name.toLowerCase().includes('latter-day saints') ?? false

	const handleFaithSelection = async (selectedFaithId: string) => {
		setFaithId(selectedFaithId)
		setStakeId('')
		setWardId('')
		setStakes([])
		setWardGroups([])

		if (!selectedFaithId) return
		const faith = faiths.find((item) => item.id === selectedFaithId)
		const isLds = !!faith?.name.toLowerCase().includes('latter-day saints')
		if (isLds) {
			await loadLdsUnits(selectedFaithId)
		}
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

	useEffect(() => {
		if (step !== 'welcome') return

		const timer = setTimeout(() => {
			setWelcomeCountdown((current) => {
				if (current <= 1) {
					setTimeout(() => resetForm(), 0)
					return 0
				}

				return current - 1
			})
		}, 1000)

		return () => clearTimeout(timer)
	}, [step, welcomeCountdown, resetForm])

	useEffect(() => {
		if (step !== 'newsletterSuccess') return

		const timer = setTimeout(() => {
			setNewsletterCountdown((current) => {
				if (current <= 1) {
					setTimeout(() => resetForm(), 0)
					return 0
				}

				return current - 1
			})
		}, 1000)

		return () => clearTimeout(timer)
	}, [step, newsletterCountdown, resetForm])

	useEffect(() => {
		const finalSteps: Array<typeof step> = ['workers', 'welcome']
		if (!finalSteps.includes(step)) return

		let inactivityTimer: ReturnType<typeof setTimeout> | null = null
		let countdownTicker: ReturnType<typeof setInterval> | null = null
		let deadlineMs = Date.now() + 15000

		const updateWorkersCountdown = () => {
			if (step !== 'workers') return
			const secondsRemaining = Math.max(
				0,
				Math.ceil((deadlineMs - Date.now()) / 1000)
			)
			setWorkersRedirectCountdown(secondsRemaining)
		}

		const restartInactivityTimer = () => {
			deadlineMs = Date.now() + 15000
			if (inactivityTimer) clearTimeout(inactivityTimer)
			inactivityTimer = setTimeout(() => {
				resetForm()
			}, 15000)
			updateWorkersCountdown()
		}

		setTimeout(() => restartInactivityTimer(), 0)
		countdownTicker = setInterval(updateWorkersCountdown, 250)

		const activityEvents: Array<keyof WindowEventMap> = [
			'pointerdown',
			'touchstart',
			'keydown',
		]

		activityEvents.forEach((eventName) => {
			window.addEventListener(eventName, restartInactivityTimer)
		})

		return () => {
			if (inactivityTimer) clearTimeout(inactivityTimer)
			if (countdownTicker) clearInterval(countdownTicker)
			activityEvents.forEach((eventName) => {
				window.removeEventListener(eventName, restartInactivityTimer)
			})
		}
	}, [step, resetForm])

	// ──────────────────────────────
	// RENDER
	// ──────────────────────────────
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-(--green-logo)">
			<div className="w-full m-4 space-y-3">
				<Card className="w-full">
				<CardContent className="space-y-3 p-4 md:p-5">
					{step !== 'identify' && (
						<div className="flex justify-end">
							<Button
								type="button"
								variant="outline"
								className="h-12 px-5 text-lg font-semibold"
								onClick={resetForm}
							>
								Back
							</Button>
						</div>
					)}

					{step === 'identify' && (
						<IdentifyStep
							input={input}
							suggestions={suggestions}
							searching={searching}
							isEditingName={editingPersonId !== null}
							onInputChange={handleInputChange}
							onSelectSuggestion={(p) => {
								setEditingPersonId(null)
								setSelectedPerson(p)
								setInput(p.fullName)
								setSuggestions([])
								handleIdentify(p)
							}}
						/>
					)}

					{step === 'newsletterSignup' && (
						<div className="space-y-4 py-4">
							<div className="space-y-2 text-center">
								<p className="text-3xl font-semibold">
									Sign up for our newsletter
								</p>
								<p className="text-lg text-muted-foreground">
									Enter your email address and we&apos;ll send you a confirmation
									link.
								</p>
							</div>

							<Input
								type="email"
								inputMode="email"
								autoComplete="email"
								placeholder="you@example.com"
								className="h-14 text-lg rounded-xl"
								value={newsletterEmail}
								onChange={(e) => setNewsletterEmail(e.target.value)}
								disabled={newsletterSubmitting}
							/>

							{newsletterError && (
								<p className="text-center text-base text-destructive">
									{newsletterError}
								</p>
							)}

							<Button
								type="button"
								className="h-14 w-full rounded-xl text-lg"
								onClick={() => {
									void handleNewsletterSignup()
								}}
								disabled={
									newsletterSubmitting || !newsletterEmail.trim().includes('@')
								}
							>
								{newsletterSubmitting ? 'Submitting…' : 'Sign up'}
							</Button>
						</div>
					)}

					{step === 'identify' && (
						<OnScreenKeyboard
							onKey={(char) => handleInputChange(input + char)}
							onBackspace={() => handleInputChange(input.slice(0, -1))}
							onClear={() => handleInputChange('')}
							onSpace={() => handleInputChange(`${input} `)}
							onContinue={() => {
								void handleContinueFromIdentify()
							}}
							canContinue={input.trim().length >= 2}
						/>
					)}

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
							isSubmitting={visitSubmitting}
							onSubmit={handleSubmitVisit}
						/>
					)}

					{/* STEP: ROLE CHOICE FOR WORKERS */}
					{step === 'roleChoice' &&
						(selectedPerson || newName.trim()) && (
						<RoleChoiceStep
							person={
								selectedPerson ?? {
									id: '',
									fullName: newName.trim(),
									userId: null,
									isWorker: false,
									hasPasscode: false,
								}
							}
							onEditName={() => {
								void handleEditName()
							}}
							onVisit={async () => {
								setVisitReason('patron')
								await loadPurposes()
								setStep('visit')
							}}
							onTraining={async () => {
								setVisitReason('training')
								setPartOfFaithGroup(null)
								setFaithId('')
								setStakeId('')
								setWardId('')
								setGroupSize(0)
								await loadFaiths()
								setStep('visitGroupDetails')
							}}
							onGroup={async () => {
								setVisitReason('group')
								setPartOfFaithGroup(null)
								setFaithId('')
								setStakeId('')
								setWardId('')
								setGroupSize(0)
								await loadFaiths()
								setStep('visitGroupDetails')
							}}
							onShift={
								selectedPerson?.isWorker ? () => setStep('shift') : undefined
							}
						/>
					)}

					{step === 'visitGroupDetails' && (
						<VisitGroupDetailsStep
							reasonLabel={
								visitReason === 'training'
									? "You're signing in for training."
									: "You're signing in with a group."
							}
							partOfFaithGroup={partOfFaithGroup}
							setPartOfFaithGroup={(value) => {
								setPartOfFaithGroup(value)
								if (!value) {
									setFaithId('')
									setStakeId('')
									setWardId('')
									setStakes([])
									setWardGroups([])
								}
							}}
							faiths={faiths}
							faithId={faithId}
							setFaithId={(value) => {
								void handleFaithSelection(value)
							}}
							stakes={stakes}
							stakeId={stakeId}
							setStakeId={(value) => {
								setStakeId(value)
								setWardId('')
							}}
							wardGroups={wardGroups}
							wardId={wardId}
							setWardId={setWardId}
							attendeeCount={groupSize}
							setAttendeeCount={(value) => setGroupSize(Math.max(0, value))}
							isLds={isLdsFaith}
							onContinue={handleSubmitTrainingOrGroupVisit}
						/>
					)}

					{step === 'missionaries' && (
						<MissionariesStep
							attendeeCount={groupSize}
							setAttendeeCount={(value) => setGroupSize(Math.max(0, value))}
							onSubmit={handleSubmitTrainingOrGroupVisit}
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
							redirectSecondsRemaining={workersRedirectCountdown}
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

					{step === 'welcome' && (
						<WelcomeStep
							secondsRemaining={welcomeCountdown}
							onReturnNow={resetForm}
						/>
					)}

					{step === 'newsletterSuccess' && (
						<div className="space-y-4 py-10 text-center">
							<p className="text-4xl font-semibold">Thank you!</p>
							<p className="text-2xl text-muted-foreground">
								{newsletterSuccessMessage}
							</p>
							<p className="text-base text-muted-foreground">
								Returning to sign-in in {newsletterCountdown} seconds...
							</p>
							<Button variant="outline" onClick={resetForm}>
								Return to Sign In Now
							</Button>
						</div>
					)}

					{serverMessage && (
						<p className="text-center text-xl text-muted-foreground">
							{serverMessage}
						</p>
					)}
				</CardContent>
				</Card>

				{step === 'identify' && (
					<div className="flex justify-center">
						<Button
							type="button"
							variant="secondary"
							className="h-12 rounded-xl px-6 text-base font-semibold"
							onClick={() => {
								setNewsletterEmail('')
								setNewsletterError(null)
								setNewsletterSubmitting(false)
								setStep('newsletterSignup')
							}}
						>
							Sign up for our newsletter
						</Button>
					</div>
				)}
			</div>

			{step === 'identify' && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="absolute bottom-3 right-3 h-8 px-2 text-[11px] font-medium text-white/65 hover:text-white hover:bg-white/10"
					onClick={() => {
						void handleHardRefresh()
					}}
				>
					Refresh
				</Button>
			)}
		</div>
	)
}
