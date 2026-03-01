import { test, expect } from '@playwright/test'

const DEFAULT_USER_ID = 'e6d74af8-c02f-4c75-ae88-c50e12138a05'

test('sign in, create reservation, and queue emails', async ({
	page,
	request,
}) => {
	const username = process.env.E2E_USERNAME
	const password = process.env.E2E_PASSWORD
	const userId = process.env.E2E_USER_ID ?? DEFAULT_USER_ID
	const secret = process.env.E2E_OUTBOX_SECRET

	if (!username || !password) {
		throw new Error('Missing E2E_USERNAME or E2E_PASSWORD environment variables.')
	}

	const headers = secret ? { 'x-e2e-secret': secret } : undefined

	await request.delete('/api/test/email-outbox', { headers })

	const fixtureRes = await request.get(
		`/api/test/reservation-fixture?userId=${encodeURIComponent(
			userId
		)}&userLookup=${encodeURIComponent(username)}`,
		{ headers }
	)
	expect(fixtureRes.ok()).toBeTruthy()
	const fixture = await fixtureRes.json()

	await page.goto('/en/login?redirect=/en/reservation')

	await page.fill('#login-username', username)
	await page.fill('#login-password', password)
	await page.getByRole('button', { name: /sign in|log in|login/i }).click()

	await expect(page).toHaveURL(/\/en\/reservation$/)

	const form = page.locator('#reservation-form')
	const comboboxes = form.getByRole('combobox')

	// Resource select
	await comboboxes.nth(0).click()
	await page.getByRole('option', { name: fixture.resourceName }).click()

	// Date
	await form.locator('input[type="date"]').fill(fixture.date)

	// Time select
	await comboboxes.nth(1).click()
	await page.getByRole('option').first().click()

	// Attendees
	await form.locator('input[type="number"]').fill('1')

	// Phone
	await form.locator('input[type="tel"]').fill('(208) 555-1234')

	// Submit
	await page.getByRole('button', { name: /reservation/i }).click()

	await expect(page).toHaveURL(/\/en\/reservation\/success$/)

	const outboxRes = await request.get('/api/test/email-outbox', { headers })
	expect(outboxRes.ok()).toBeTruthy()
	const { outbox } = await outboxRes.json()

	expect(outbox.length).toBeGreaterThan(0)

	const usernameLooksLikeEmail = username.includes('@')
	const expectedSubmitter = usernameLooksLikeEmail
		? username
		: fixture.submitterEmail

	if (expectedSubmitter) {
		const submitter = expectedSubmitter.trim().toLowerCase()
		const sentToSubmitter = outbox.some((m: { to: string[] }) =>
			m.to.some((email) => email.trim().toLowerCase() === submitter)
		)

		if (!sentToSubmitter) {
			const recipients = outbox.flatMap((m: { to: string[] }) => m.to)
			throw new Error(
				`Submitter email not found in outbox. Submitter=${submitter}. Recipients=${JSON.stringify(
					recipients
				)}`
			)
		}
	}
})

test('consultant can submit for someone else and email goes to patron', async ({
	page,
	request,
}) => {
	const username = process.env.E2E_USERNAME
	const password = process.env.E2E_PASSWORD
	const userId = process.env.E2E_USER_ID ?? DEFAULT_USER_ID
	const secret = process.env.E2E_OUTBOX_SECRET
	const patronEmail = 'patron.e2e@example.com'

	if (!username || !password) {
		throw new Error('Missing E2E_USERNAME or E2E_PASSWORD environment variables.')
	}

	const headers = secret ? { 'x-e2e-secret': secret } : undefined

	await request.delete('/api/test/email-outbox', { headers })

	const fixtureRes = await request.get(
		`/api/test/reservation-fixture?userId=${encodeURIComponent(
			userId
		)}&userLookup=${encodeURIComponent(username)}`,
		{ headers }
	)
	expect(fixtureRes.ok()).toBeTruthy()
	const fixture = await fixtureRes.json()

	await page.goto('/en/login?redirect=/en/reservation')
	await page.fill('#login-username', username)
	await page.fill('#login-password', password)
	await page.getByRole('button', { name: /sign in|log in|login/i }).click()
	await expect(page).toHaveURL(/\/en\/reservation$/)

	const form = page.locator('#reservation-form')
	const comboboxes = form.getByRole('combobox')

	await comboboxes.nth(0).click()
	await page.getByRole('option', { name: fixture.resourceName }).click()
	await form.locator('input[type="date"]').fill(fixture.date)
	await comboboxes.nth(1).click()
	await page.getByRole('option').first().click()
	await form.locator('input[type="number"]').fill('1')
	await form.locator('input[type="tel"]').fill('(208) 555-1234')

	await form
		.getByRole('checkbox', { name: /filling this out for someone else/i })
		.click()
	await form.locator('input[type="email"]').fill(patronEmail)

	await page.getByRole('button', { name: /reservation/i }).click()
	await expect(page).toHaveURL(/\/en\/reservation\/success$/)

	const outboxRes = await request.get('/api/test/email-outbox', { headers })
	expect(outboxRes.ok()).toBeTruthy()
	const { outbox } = await outboxRes.json()

	const sentToPatron = outbox.some((m: { to: string[] }) =>
		m.to.some((email) => email.trim().toLowerCase() === patronEmail.toLowerCase())
	)

	expect(sentToPatron).toBeTruthy()
})
