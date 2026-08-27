const test = require('node:test');
const assert = require('node:assert');
const { getAldiWeekBoundaries, validateAldiPeriod } = require('../src/utils/aldiWeeklyDates');

test('getAldiWeekBoundaries', async (t) => {
    await t.test('Normal week (2026 KW35)', () => {
        const bounds = getAldiWeekBoundaries(2026, 35);
        assert.deepStrictEqual(bounds, {
            start: '2026-08-26',
            end: '2026-09-01'
        });
    });

    await t.test('ISO Week 1 (2026 KW01)', () => {
        // Week 1 of 2026 starts on Monday Dec 29, 2025
        // Wednesday: Dec 31, 2025. Tuesday: Jan 6, 2026.
        const bounds = getAldiWeekBoundaries(2026, 1);
        assert.deepStrictEqual(bounds, {
            start: '2025-12-31',
            end: '2026-01-06'
        });
    });

    await t.test('Year boundary crossing (2025 KW52)', () => {
        // Week 52 of 2025 starts on Monday Dec 22, 2025
        // Wednesday: Dec 24. Tuesday: Dec 30.
        const bounds = getAldiWeekBoundaries(2025, 52);
        assert.deepStrictEqual(bounds, {
            start: '2025-12-24',
            end: '2025-12-30'
        });
    });

    await t.test('Valid Week 53 (2020 KW53)', () => {
        // 2020 is a leap year starting on Wednesday, so it has 53 weeks.
        // Week 53 Monday is Dec 28, 2020.
        // Wednesday: Dec 30, 2020. Tuesday: Jan 5, 2021.
        const bounds = getAldiWeekBoundaries(2020, 53);
        assert.deepStrictEqual(bounds, {
            start: '2020-12-30',
            end: '2021-01-05'
        });
    });

    await t.test('Invalid Week 53 (2025 KW53)', () => {
        // 2025 does not have a week 53
        const bounds = getAldiWeekBoundaries(2025, 53);
        assert.strictEqual(bounds, null);
    });

    await t.test('Invalid inputs', () => {
        assert.strictEqual(getAldiWeekBoundaries(1999, 1), null);
        assert.strictEqual(getAldiWeekBoundaries(2026, 0), null);
        assert.strictEqual(getAldiWeekBoundaries(2026, 54), null);
    });
});

test('validateAldiPeriod', async (t) => {
    // 2026 KW35 bounds: 2026-08-26 to 2026-09-01
    
    await t.test('Valid period fully inside', () => {
        const res = validateAldiPeriod('2026-08-27', '2026-08-31', 2026, 35);
        assert.strictEqual(res.status, 'valid');
        assert.strictEqual(res.start, '2026-08-27');
        assert.strictEqual(res.end, '2026-08-31');
    });

    await t.test('Clamped start (partial overlap before)', () => {
        const res = validateAldiPeriod('2026-08-24', '2026-08-31', 2026, 35);
        assert.strictEqual(res.status, 'clamped');
        assert.strictEqual(res.start, '2026-08-26');
        assert.strictEqual(res.end, '2026-08-31');
    });

    await t.test('Clamped end (partial overlap after)', () => {
        const res = validateAldiPeriod('2026-08-27', '2026-09-03', 2026, 35);
        assert.strictEqual(res.status, 'clamped');
        assert.strictEqual(res.start, '2026-08-27');
        assert.strictEqual(res.end, '2026-09-01');
    });

    await t.test('Clamped both (wider than week)', () => {
        const res = validateAldiPeriod('2026-08-24', '2026-09-03', 2026, 35);
        assert.strictEqual(res.status, 'clamped');
        assert.strictEqual(res.start, '2026-08-26');
        assert.strictEqual(res.end, '2026-09-01');
    });

    await t.test('Completely outside before', () => {
        const res = validateAldiPeriod('2026-08-01', '2026-08-10', 2026, 35);
        assert.strictEqual(res.status, 'invalid_outside');
        assert.strictEqual(res.start, null);
        assert.strictEqual(res.end, null);
    });

    await t.test('Completely outside after', () => {
        const res = validateAldiPeriod('2026-09-05', '2026-09-10', 2026, 35);
        assert.strictEqual(res.status, 'invalid_outside');
        assert.strictEqual(res.start, null);
        assert.strictEqual(res.end, null);
    });

    await t.test('Invalid format', () => {
        const res = validateAldiPeriod('2026-08-26', null, 2026, 35);
        assert.strictEqual(res.status, 'invalid_format');
        
        const res2 = validateAldiPeriod('aug 26', 'sep 1', 2026, 35);
        assert.strictEqual(res2.status, 'invalid_format');
    });

    await t.test('Invalid reversed dates', () => {
        const res = validateAldiPeriod('2026-09-01', '2026-08-26', 2026, 35);
        assert.strictEqual(res.status, 'invalid_reversed');
        assert.strictEqual(res.start, null);
        assert.strictEqual(res.end, null);
    });

    await t.test('Invalid calendar dates (e.g. Feb 30)', () => {
        const val = validateAldiPeriod('2026-02-30', '2026-03-05', 2026, 10);
        assert.strictEqual(val.status, 'invalid_format');
    });
});
