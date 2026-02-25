import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function login(page: Page) {
	const username = process.env.E2E_USERNAME
	const password = process.env.E2E_PASSWORD

	if (!username || !password) {
		throw new Error('Missing E2E_USERNAME or E2E_PASSWORD environment variables.')
	}

	await page.goto('/en/login?redirect=/en/dashboard')

	if (!page.url().includes('/en/login')) return

	await expect(page.locator('#login-username')).toBeVisible()
	await page.fill('#login-username', username)
	await page.fill('#login-password', password)
	await page.locator('button[form=\"login-form\"]').click()

	await page.waitForLoadState('networkidle')

	if (page.url().includes('/en/login?username=')) {
		throw new Error(
			'Login form submitted before client hydration (native GET fallback).'
		)
	}
}

async function waitForRequestState(args: {
	request: APIRequestContext
	requestId: string
	headers?: Record<string, string>
	accept: (state: {
		request: {
			status: string
			nominatedSubUserId: string | null
			acceptedByUserId: string | null
		}
		userNotificationCount: number
	}) => boolean
	userId?: string
}) {
	for (let i = 0; i < 20; i += 1) {
		const stateRes = await args.request.get(
			`/api/test/substitute-request-state?requestId=${encodeURIComponent(
				args.requestId
			)}${args.userId ? `&userId=${encodeURIComponent(args.userId)}` : ''}`,
			{ headers: args.headers }
		)

		if (!stateRes.ok()) {
			throw new Error(`state endpoint failed: ${stateRes.status()}`)
		}

		const state = await stateRes.json()
		if (args.accept(state)) return state

		await new Promise((resolve) => setTimeout(resolve, 300))
	}

	throw new Error('Timed out waiting for expected substitute request state.')
}

test('requester can accept a volunteer and trigger notification email', async ({
	page,
	request,
}) => {
	const username = process.env.E2E_USERNAME
	const secret = process.env.E2E_OUTBOX_SECRET

	if (!username) {
		throw new Error('Missing E2E_USERNAME environment variable.')
	}

	const headers = secret ? { 'x-e2e-secret': secret } : undefined

	await request.delete('/api/test/email-outbox', { headers })

	const fixtureRes = await request.get(
		`/api/test/substitute-fixture?scenario=accept-volunteer&userLookup=${encodeURIComponent(
			username
		)}`,
		{ headers }
	)
	if (!fixtureRes.ok()) {
		throw new Error(
			`substitute fixture failed (${fixtureRes.status()}): ${await fixtureRes.text()}`
		)
	}
	const fixture = await fixtureRes.json()

	await login(page)
	await page.goto(fixture.requestUrl)

	await expect(page).toHaveURL(new RegExp(`/en/substitutes/request/${fixture.requestId}`))

	await page.getByRole('button', { name: /^accept$/i }).first().click()
	await waitForRequestState({
		request,
		requestId: fixture.requestId,
		headers,
		userId: fixture.helperWorkerUserId,
		accept: (state) =>
			state.request.status === 'accepted' &&
			state.request.acceptedByUserId === fixture.helperWorkerUserId &&
			state.userNotificationCount > 0,
	})

	const outboxRes = await request.get('/api/test/email-outbox', { headers })
	expect(outboxRes.ok()).toBeTruthy()
	const { outbox } = await outboxRes.json()

	expect(outbox.length).toBeGreaterThan(0)

	const target = String(fixture.helperWorkerEmail ?? '').trim().toLowerCase()
	const hit = outbox.some((m: { to: string[] }) =>
		m.to.some((email) => email.trim().toLowerCase() === target)
	)

	expect(hit).toBeTruthy()
})

test('requester can nominate a worker and trigger assignment email', async ({
	page,
	request,
}) => {
	const username = process.env.E2E_USERNAME
	const secret = process.env.E2E_OUTBOX_SECRET

	if (!username) {
		throw new Error('Missing E2E_USERNAME environment variable.')
	}

	const headers = secret ? { 'x-e2e-secret': secret } : undefined

	await request.delete('/api/test/email-outbox', { headers })

	const fixtureRes = await request.get(
		`/api/test/substitute-fixture?scenario=nomination&userLookup=${encodeURIComponent(
			username
		)}`,
		{ headers }
	)
	if (!fixtureRes.ok()) {
		throw new Error(
			`substitute fixture failed (${fixtureRes.status()}): ${await fixtureRes.text()}`
		)
	}
	const fixture = await fixtureRes.json()

	await login(page)
	await page.goto(fixture.requestUrl)

	await expect(page).toHaveURL(new RegExp(`/en/substitutes/request/${fixture.requestId}`))

	const targetRow = page
		.locator('li')
		.filter({ hasText: String(fixture.helperWorkerName ?? '') })
		.first()

	await expect(targetRow).toBeVisible()
	await targetRow.getByRole('button', { name: /^request$/i }).click()
	await waitForRequestState({
		request,
		requestId: fixture.requestId,
		headers,
		userId: fixture.helperWorkerUserId,
		accept: (state) =>
			state.request.status === 'awaiting_nomination_confirmation' &&
			state.request.nominatedSubUserId === fixture.helperWorkerUserId &&
			state.userNotificationCount > 0,
	})

	const outboxRes = await request.get('/api/test/email-outbox', { headers })
	expect(outboxRes.ok()).toBeTruthy()
	const { outbox } = await outboxRes.json()

	expect(outbox.length).toBeGreaterThan(0)

	const target = String(fixture.helperWorkerEmail ?? '').trim().toLowerCase()
	const hit = outbox.some((m: { to: string[] }) =>
		m.to.some((email) => email.trim().toLowerCase() === target)
	)

	expect(hit).toBeTruthy()
})
