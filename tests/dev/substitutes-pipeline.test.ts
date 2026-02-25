import test from 'node:test'
import assert from 'node:assert/strict'

import {
	canCancelSubRequest,
	canReopenSubRequest,
	computeAvailabilityScore,
} from '@/lib/substitutes/pipeline'
import { formatYmdLong, formatYmdMonth, formatYmdShort, toAmPm } from '@/utils/time'

test('availability score ranks exact usually highest', () => {
	assert.equal(computeAvailabilityScore('usually', 'exact'), 100)
	assert.equal(computeAvailabilityScore('usually', 'shiftOnly'), 80)
	assert.equal(computeAvailabilityScore('maybe', 'exact'), 60)
	assert.equal(computeAvailabilityScore('maybe', 'shiftOnly'), 40)
	assert.equal(computeAvailabilityScore(null, 'none'), 0)
})

test('sub request state guards enforce reopen/cancel rules', () => {
	assert.equal(canReopenSubRequest('cancelled'), true)
	assert.equal(canReopenSubRequest('expired'), true)
	assert.equal(canReopenSubRequest('open'), false)
	assert.equal(canReopenSubRequest('accepted'), false)

	assert.equal(canCancelSubRequest('open'), true)
	assert.equal(canCancelSubRequest('awaiting_request_confirmation'), true)
	assert.equal(canCancelSubRequest('awaiting_nomination_confirmation'), true)
	assert.equal(canCancelSubRequest('accepted'), false)
	assert.equal(canCancelSubRequest('cancelled'), false)
	assert.equal(canCancelSubRequest('expired'), false)
})

test('substitute-facing date/time formatting respects locale inputs', () => {
	const enLong = formatYmdLong('2026-02-25', 'en-US')
	const esLong = formatYmdLong('2026-02-25', 'es-ES')
	const enShort = formatYmdShort('2026-02-25', 'en-US')
	const enMonth = formatYmdMonth('2026-02', 'en-US')
	const enTime = toAmPm('13:05', 'en-US')

	assert.ok(enLong.includes('2026'))
	assert.ok(esLong.includes('2026'))
	assert.notEqual(enLong, esLong)
	assert.ok(enShort.length > 0)
	assert.ok(enMonth.includes('2026'))
	assert.ok(enTime.length > 0)
})
