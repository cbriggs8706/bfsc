'use client'

import { useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldDescription,
	FieldError,
} from '@/components/ui/field'

const additionalGrantorSchema = z.object({
	name: z.string().optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	signature: z.string().optional(),
	date: z.string().optional(),
	parentName: z.string().optional(),
	parentPhone: z.string().optional(),
	parentAddress: z.string().optional(),
	parentSignature: z.string().optional(),
	parentDate: z.string().optional(),
})

const schema = z
	.object({
		projectGrantor: z.string().min(1, 'Required'),
		ipoNumber: z.string().optional(),
		fileNumber: z.string().optional(),

		grantorName: z.string().min(1, 'Required'),
		grantorPhone: z.string().min(7, 'Required'),
		grantorAddress: z.string().min(5, 'Required'),
		photographerName: z.string().optional(),
		description: z.string().min(5, 'Required'),

		isMinor: z.boolean(),
		parentName: z.string().optional(),
		parentPhone: z.string().optional(),
		parentAddress: z.string().optional(),
		parentSignature: z.string().optional(),
		parentDate: z.string().optional(),

		grantorSignature: z.string().min(1, 'Required'),
		grantorDate: z.string().min(1, 'Required'),

		additionalGrantors: z.array(additionalGrantorSchema),

		consentConfirmed: z.boolean().refine((v) => v, 'You must agree'),
	})
	.superRefine((values, ctx) => {
		if (values.isMinor) {
			if (!values.parentName) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Required',
					path: ['parentName'],
				})
			}
			if (!values.parentSignature) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Required',
					path: ['parentSignature'],
				})
			}
			if (!values.parentDate) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Required',
					path: ['parentDate'],
				})
			}
		}
	})

export type SocialMediaConsentValues = z.infer<typeof schema>

const TERMS = [
	'Grantor hereby irrevocably grants to Intellectual Reserve, Inc. (IRI) and its licensees, successors, and assigns consent and full right to interview Grantor; record or otherwise reproduce interviews; and to publish, distribute, perform, or otherwise use interview materials and related content in any media now known or later developed, worldwide and in perpetuity.',
	'Grantor agrees that Grantor has no right, title, or interest in any IRI work or publication produced under this Release, and makes no claim against IRI based on any use of these rights.',
	'Grantor will not issue or authorize publicity relating to this Release or IRI without prior written approval, and will not imply IRI endorsement of Grantor or any third party.',
	'Grantor represents and warrants that Grantor is free to enter into this Release and agrees to indemnify and hold IRI harmless from any losses arising from breach of this Release.',
	'This Release is governed by Utah law. Disputes will be handled first by mutual consultation; if unresolved, the parties agree to the jurisdiction of the courts in Utah.',
]

export function SocialMediaConsentForm() {
	const form = useForm<SocialMediaConsentValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			projectGrantor: '',
			ipoNumber: '',
			fileNumber: '',
			grantorName: '',
			grantorPhone: '',
			grantorAddress: '',
			photographerName: '',
			description: '',
			isMinor: false,
			parentName: '',
			parentPhone: '',
			parentAddress: '',
			parentSignature: '',
			parentDate: '',
			grantorSignature: '',
			grantorDate: '',
			additionalGrantors: [],
			consentConfirmed: false,
		},
	})

	const additional = useFieldArray({
		control: form.control,
		name: 'additionalGrantors',
	})

	const isMinor = form.watch('isMinor')

	async function onSubmit(values: SocialMediaConsentValues) {
		const res = await fetch('/api/forms/social-media-consent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values),
		})

		const data = await res.json()
		if (!res.ok) {
			toast.error(data.error ?? 'Submission failed')
			return
		}

		toast.success('Consent form submitted and emailed')
		form.reset()
		additional.replace([])
	}

	const termItems = useMemo(() => TERMS, [])

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Release to Use Image</CardTitle>
			</CardHeader>
			<CardContent className="space-y-8">
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<FieldGroup>
						<Field>
							<FieldLabel>Project Information</FieldLabel>
							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<label className="text-sm font-medium">Grantor</label>
									<Input {...form.register('projectGrantor')} />
									<FieldError errors={[form.formState.errors.projectGrantor]} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">IPO number</label>
									<Input {...form.register('ipoNumber')} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">File number (optional)</label>
									<Input {...form.register('fileNumber')} />
								</div>
							</div>
						</Field>

						<Field>
							<FieldLabel>Parties to Release</FieldLabel>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<label className="text-sm font-medium">Grantor name</label>
									<Input {...form.register('grantorName')} />
									<FieldError errors={[form.formState.errors.grantorName]} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Telephone (with area code)</label>
									<Input {...form.register('grantorPhone')} />
									<FieldError errors={[form.formState.errors.grantorPhone]} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Name of photographer</label>
									<Input {...form.register('photographerName')} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Grantor address</label>
									<Input {...form.register('grantorAddress')} />
									<FieldError errors={[form.formState.errors.grantorAddress]} />
								</div>
							</div>
							<div className="mt-4 space-y-2">
								<label className="text-sm font-medium">Description of product</label>
								<Textarea rows={3} {...form.register('description')} />
								<FieldError errors={[form.formState.errors.description]} />
							</div>
						</Field>
					</FieldGroup>

					<FieldGroup>
						<Field>
							<FieldLabel>Terms and Conditions</FieldLabel>
							<div className="space-y-3 text-sm text-muted-foreground">
								{termItems.map((term) => (
									<p key={term}>{term}</p>
								))}
							</div>
							<FieldDescription>
								By signing below, Grantor warrants and represents that he or she has
								read this Release, understands its contents, and has the legal
								capacity to execute this Release.
							</FieldDescription>
						</Field>
					</FieldGroup>

					<FieldGroup>
						<Field>
							<FieldLabel>Grantor Signature</FieldLabel>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<label className="text-sm font-medium">Signature (type full name)</label>
									<Input {...form.register('grantorSignature')} />
									<FieldError errors={[form.formState.errors.grantorSignature]} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Date</label>
									<Input type="date" {...form.register('grantorDate')} />
									<FieldError errors={[form.formState.errors.grantorDate]} />
								</div>
							</div>
						</Field>
					</FieldGroup>

					<FieldGroup>
						<Field>
							<FieldLabel>Parental Consent (if Grantor is a minor)</FieldLabel>
							<div className="flex items-center gap-3">
								<Checkbox
									checked={isMinor}
									onCheckedChange={(value) => form.setValue('isMinor', Boolean(value))}
								/>
								<span className="text-sm">Grantor is a minor</span>
							</div>

							{isMinor && (
								<div className="mt-4 grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-medium">Parent/guardian name</label>
										<Input {...form.register('parentName')} />
										<FieldError errors={[form.formState.errors.parentName]} />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Telephone (with area code)</label>
										<Input {...form.register('parentPhone')} />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Address</label>
										<Input {...form.register('parentAddress')} />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Parent/guardian signature</label>
										<Input {...form.register('parentSignature')} />
										<FieldError errors={[form.formState.errors.parentSignature]} />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Date</label>
										<Input type="date" {...form.register('parentDate')} />
										<FieldError errors={[form.formState.errors.parentDate]} />
									</div>
								</div>
							)}
						</Field>
					</FieldGroup>

					<FieldGroup>
						<Field>
							<FieldLabel>Additional Grantors</FieldLabel>
							<FieldDescription>
								Add additional grantors if this consent applies to multiple people.
							</FieldDescription>
							<div className="space-y-4">
								{additional.fields.map((field, index) => (
									<div
										key={field.id}
										className="rounded-md border p-4 space-y-4"
									>
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<label className="text-sm font-medium">Grantor name</label>
												<Input {...form.register(`additionalGrantors.${index}.name`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Telephone</label>
												<Input {...form.register(`additionalGrantors.${index}.phone`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Address</label>
												<Input {...form.register(`additionalGrantors.${index}.address`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Signature</label>
												<Input {...form.register(`additionalGrantors.${index}.signature`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Date</label>
												<Input type="date" {...form.register(`additionalGrantors.${index}.date`)} />
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<label className="text-sm font-medium">Parent/guardian name (if minor)</label>
												<Input {...form.register(`additionalGrantors.${index}.parentName`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Parent/guardian phone</label>
												<Input {...form.register(`additionalGrantors.${index}.parentPhone`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Parent/guardian address</label>
												<Input {...form.register(`additionalGrantors.${index}.parentAddress`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Parent/guardian signature</label>
												<Input {...form.register(`additionalGrantors.${index}.parentSignature`)} />
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Parent/guardian date</label>
												<Input type="date" {...form.register(`additionalGrantors.${index}.parentDate`)} />
											</div>
										</div>

										<div className="flex justify-end">
											<Button
												type="button"
												variant="outline"
												onClick={() => additional.remove(index)}
											>
												Remove
											</Button>
										</div>
									</div>
								))}
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									additional.append({
										name: '',
										phone: '',
										address: '',
										signature: '',
										date: '',
										parentName: '',
										parentPhone: '',
										parentAddress: '',
										parentSignature: '',
										parentDate: '',
									})
								}
							>
								Add Grantor
							</Button>
						</Field>
					</FieldGroup>

					<FieldGroup>
						<Field>
							<div className="flex items-start gap-3">
								<Checkbox
									checked={form.watch('consentConfirmed')}
									onCheckedChange={(value) =>
										form.setValue('consentConfirmed', Boolean(value))
									}
								/>
								<div>
									<p className="text-sm font-medium">
										I have read and agree to the Release to Use Image.
									</p>
									<FieldError errors={[form.formState.errors.consentConfirmed]} />
								</div>
							</div>
						</Field>
					</FieldGroup>

					<Button disabled={form.formState.isSubmitting}>
						Submit Consent Form
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
