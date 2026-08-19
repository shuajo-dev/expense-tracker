/**
 * Money is handled as integer cents everywhere in this app, matching the
 * backend contract — no floating-point arithmetic on money, ever. These two
 * conversions are pure string/integer manipulation, not float math, so a
 * value like "19.99" always becomes exactly 1999 cents.
 */

export function dollarsToCents(value: string): number | null {
    const match = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(value);

    if (!match) {
        return null;
    }

    const [, whole, fraction = ''] = match;

    return parseInt(whole, 10) * 100 + parseInt(fraction.padEnd(2, '0'), 10);
}

export function centsToDollarInput(cents: number): string {
    const whole = Math.floor(cents / 100);
    const remainder = String(cents % 100).padStart(2, '0');

    return `${whole}.${remainder}`;
}

/** Presentation-only: formatting for display never feeds back into stored data. */
export function formatCents(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
}
