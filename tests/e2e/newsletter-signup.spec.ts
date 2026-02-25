import { test, expect } from '@playwright/test'

test('homepage monthly newsletter signup queues confirmation email', async ({
	page,
	request,
}) => {
	const secret = process.env.E2E_OUTBOX_SECRET
	const headers = secret ? { 'x-e2e-secret': secret } : undefined

	await request.delete('/api/test/email-outbox', { headers })

	const uniqueEmail = `e2e-newsletter-${Date.now()}-${Math.random()
		.toString(36)
		.slice(2, 10)}@example.com`

	await page.goto('/en')
	await page
		.getByRole('button', { name: 'Subscribe to our Monthly Newsletter' })
		.click()

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()

	await dialog.getByPlaceholder('you@example.com').fill(uniqueEmail)
	await dialog.getByRole('button', { name: 'Subscribe' }).click()

	await expect(
		dialog.getByText('Check your email to confirm your subscription.')
	).toBeVisible()

	const outboxRes = await request.get('/api/test/email-outbox', { headers })
	expect(outboxRes.ok()).toBeTruthy()

	const { outbox } = await outboxRes.json()
	expect(outbox.length).toBeGreaterThan(0)

	const confirmation = outbox.find(
		(email: { to: string[]; subject: string }) =>
			email.subject === 'Confirm your newsletter subscription' &&
			email.to.some(
				(recipient) =>
					recipient.trim().toLowerCase() === uniqueEmail.toLowerCase()
			)
	)

	expect(confirmation).toBeTruthy()
})
