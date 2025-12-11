// app/[locale]/kiosk/page.tsx
'use client'

import { useState } from 'react'
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
import { useRouter } from 'next/navigation'

type PersonSummary = {
	id: string
	fullName: string
	userId: string | null
	isConsultant: boolean
	hasPasscode: boolean
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

	// Step 1: identify by name or passcode
	const handleIdentify = async () => {
		setServerMessage(null)
		const res = await fetch('/api/kiosk/identify', {
			method: 'POST',
			body: JSON.stringify({ input }),
			headers: { 'Content-Type': 'application/json' },
		})
		const data = await res.json()

		if (data.status === 'notFound') {
			setNewName(data.suggestedName ?? input.trim())
			setStep('newPerson')
			return
		}

		if (data.status === 'foundSingle') {
			setSelectedPerson(data.person)
			// If consultant, ask what they’re here for
			if (data.person.isConsultant) {
				setStep('roleChoice')
			} else {
				await loadPurposes()
				setStep('visit')
			}
			return
		}

		if (data.status === 'multipleMatches') {
			setMatches(data.people)
			setStep('choosePerson')
		}
	}

	const loadPurposes = async () => {
		if (purposes.length > 0) return
		const res = await fetch('/api/kiosk/purposes') // implement a GET route
		const data = await res.json()
		setPurposes(data.purposes)
	}

	const handleChoosePerson = async (person: PersonSummary) => {
		setSelectedPerson(person)
		if (person.isConsultant) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
	}

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
		const data = await res.json()
		setSelectedPerson(data.person)
		if (data.person.isConsultant) {
			setStep('roleChoice')
		} else {
			await loadPurposes()
			setStep('visit')
		}
		if (data.person.passcode) {
			setServerMessage(`Your fast login code is ${data.person.passcode}`)
		}
	}

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
		// Reset for next patron
		resetForm()
	}

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
		setServerMessage('Thanks! Your shift has been logged.')
		resetForm()
	}

	const resetForm = () => {
		setStep('identify')
		setInput('')
		setMatches([])
		setSelectedPerson(null)
		setSelectedPurposeId('')
		setMailingOptIn(false)
		setExpectedDeparture('')
		setNewName('')
		setNewEmail('')
		setWantsPasscode(true)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl">
						Family History Center Sign In
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{step === 'identify' && (
						<div className="space-y-3">
							<Label htmlFor="input">
								Enter your <strong>name</strong> or{' '}
								<strong>6-digit code</strong>
							</Label>
							<Input
								id="input"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								autoFocus
							/>
							<Button className="w-full" onClick={handleIdentify}>
								Continue
							</Button>
						</div>
					)}

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
											<span className="text-xs">Consultant</span>
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

					{step === 'shift' && (
						<div className="space-y-3">
							<p>What time do you expect to leave today?</p>
							<Input
								type="datetime-local"
								value={expectedDeparture}
								onChange={(e) => setExpectedDeparture(e.target.value)}
							/>
							<Button className="w-full" onClick={handleSubmitShift}>
								Start my shift
							</Button>
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
