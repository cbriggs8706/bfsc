import test from 'node:test'
import assert from 'node:assert/strict'

import {
	GenieGreenieClientError,
	lookupCertificatesByEmail,
	lookupMicroskillStatusesByEmail,
	normalizeStatusesBySlug,
} from '@/lib/genieGreenieClient'

const originalFetch = globalThis.fetch
const originalBaseUrl = process.env.GENIE_GREENIE_API_BASE_URL
const originalApiKey = process.env.GENIE_GREENIE_PARTNER_API_KEY

function mockFetch(
	impl: (
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1]
	) => ReturnType<typeof fetch>
) {
	globalThis.fetch = impl as typeof fetch
}

test.afterEach(() => {
	globalThis.fetch = originalFetch
	process.env.GENIE_GREENIE_API_BASE_URL = originalBaseUrl
	process.env.GENIE_GREENIE_PARTNER_API_KEY = originalApiKey
})

test('certificate-only lookup parses badgeIcon', async () => {
	process.env.GENIE_GREENIE_API_BASE_URL = 'https://partner.example.com'
	process.env.GENIE_GREENIE_PARTNER_API_KEY = 'test-key'

	mockFetch(async (input) => {
		assert.equal(input, 'https://partner.example.com/api/certificates/lookup')

		return new Response(
			JSON.stringify({
				email: 'user@example.com',
				certificates: [
					{
						microskillSlug: 'source-linker',
						microskillTitle: 'Source Linker',
						badgeIcon: 'award',
						continueUrl: 'https://www.geniegreenie.com/learn/source-linker',
						dateEarned: '2026-02-28T12:34:56.000Z',
						earnedVersion: 1,
						currentVersion: 2,
						status: 'active',
					},
				],
			}),
			{ status: 200 }
		)
	})

	const result = await lookupCertificatesByEmail('user@example.com')
	assert.equal(result.certificates[0]?.badgeIcon, 'award')
	assert.equal(
		result.certificates[0]?.continueUrl,
		'https://www.geniegreenie.com/learn/source-linker'
	)
	assert.equal(result.certificates[0]?.status, 'active')
})

test('successful lookup', async () => {
	process.env.GENIE_GREENIE_API_BASE_URL = 'https://partner.example.com'
	process.env.GENIE_GREENIE_PARTNER_API_KEY = 'test-key'

	mockFetch(async (input, init) => {
		assert.equal(
			input,
			'https://partner.example.com/api/certificates/lookup-with-progress'
		)
		assert.equal(init?.method, 'POST')

		return new Response(
			JSON.stringify({
				email: 'user@example.com',
				statuses: [
					{
						microskillId: 12,
						microskillSlug: 'source-linker',
						microskillTitle: 'Source Linker',
						badgeIcon: 'award',
						continueUrl: 'https://www.geniegreenie.com/learn/source-linker',
						dateEarned: null,
						earnedVersion: 1,
						currentVersion: 2,
						status: 'in_progress',
						requiredCompleted: 3,
						requiredTotal: 5,
						percent: 60,
					},
				],
			}),
			{ status: 200 }
		)
	})

	const result = await lookupMicroskillStatusesByEmail('user@example.com')

	assert.equal(result.email, 'user@example.com')
	assert.equal(result.statuses.length, 1)
	assert.equal(result.statuses[0]?.microskillSlug, 'source-linker')
	assert.equal(result.statuses[0]?.status, 'in_progress')
	assert.equal(result.statuses[0]?.percent, 60)
})

test('invalid key throws 401 typed error', async () => {
	process.env.GENIE_GREENIE_API_BASE_URL = 'https://partner.example.com'
	process.env.GENIE_GREENIE_PARTNER_API_KEY = 'bad-key'

	mockFetch(async () => new Response('invalid key', { status: 401 }))

	await assert.rejects(
		() => lookupMicroskillStatusesByEmail('user@example.com'),
		(error: unknown) =>
			error instanceof GenieGreenieClientError &&
			error.code === 'UNAUTHORIZED' &&
			error.status === 401
	)
})

test('empty certificate results are returned', async () => {
	process.env.GENIE_GREENIE_API_BASE_URL = 'https://partner.example.com'
	process.env.GENIE_GREENIE_PARTNER_API_KEY = 'test-key'

	mockFetch(async () =>
		new Response(
			JSON.stringify({
				email: 'user@example.com',
				statuses: [],
			}),
			{ status: 200 }
		)
	)

	const result = await lookupMicroskillStatusesByEmail('user@example.com')
	assert.deepEqual(result.statuses, [])
})

test('normalization returns map keyed by slug with progress status', async () => {
	process.env.GENIE_GREENIE_API_BASE_URL = 'https://partner.example.com'
	process.env.GENIE_GREENIE_PARTNER_API_KEY = 'test-key'

	mockFetch(async (input) => {
		assert.equal(
			String(input),
			'https://partner.example.com/api/certificates/lookup-with-progress'
		)

		return new Response(
			JSON.stringify({
				email: 'user@example.com',
				statuses: [
					{
						microskillId: 12,
						microskillSlug: 'source-linker',
						microskillTitle: 'Source Linker',
						badgeIcon: 'award',
						continueUrl: 'https://www.geniegreenie.com/learn/source-linker',
						dateEarned: null,
						earnedVersion: null,
						currentVersion: 2,
						status: 'in_progress',
						requiredCompleted: 3,
						requiredTotal: 5,
						percent: 60,
					},
					{
						microskillId: 13,
						microskillSlug: 'tree-navigator',
						microskillTitle: 'Tree Navigator',
						badgeIcon: 'sparkles',
						continueUrl: 'https://www.geniegreenie.com/learn/tree-navigator',
						dateEarned: '2026-02-28T12:34:56.000Z',
						earnedVersion: 1,
						currentVersion: 2,
						status: 'renewal_required',
						requiredCompleted: 5,
						requiredTotal: 5,
						percent: 100,
					},
				],
			}),
			{ status: 200 }
		)
	})

	const result = await lookupMicroskillStatusesByEmail('user@example.com')
	const statuses = normalizeStatusesBySlug(result.statuses)
	assert.equal(statuses['source-linker']?.status, 'in_progress')
	assert.equal(statuses['source-linker']?.percent, 60)
	assert.equal(statuses['tree-navigator']?.status, 'renewal_required')
})
