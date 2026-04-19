/**
 * Phone number normalisation — Nigerian format (+234)
 * Mirrors the DB function normalise_phone()
 */
export function normalisePhone(raw: string): string | null {
  // Strip all non-numeric characters
  const stripped = raw.replace(/[^0-9]/g, '')

  // Rule 1: Starts with 0 → replace with +234 (e.g. 08012345678 → +2348012345678)
  if (/^0[0-9]{10}$/.test(stripped)) {
    return '+234' + stripped.slice(1)
  }

  // Rule 2: Starts with 234 without + (e.g. 2348012345678 → +2348012345678)
  if (/^234[0-9]{10}$/.test(stripped)) {
    return '+' + stripped
  }

  // Rule 3: Already has +234 prefix — stripped len is 13
  if (stripped.length === 13 && stripped.startsWith('234')) {
    return '+' + stripped
  }

  // Fallback: Non-Nigerian or unrecognised format — flag for review
  return null
}

export function validatePhone(raw: string): {
  normalised: string | null
  status: 'valid' | 'flagged' | 'empty'
  message?: string
} {
  const trimmed = raw?.trim()
  if (!trimmed) return { normalised: null, status: 'empty', message: 'Phone number is required' }

  const normalised = normalisePhone(trimmed)
  if (!normalised) {
    return {
      normalised: null,
      status: 'flagged',
      message: 'Non-local or unrecognised number — requires review',
    }
  }

  return { normalised, status: 'valid' }
}

export function formatPhoneDisplay(phone: string): string {
  // +2348012345678 → +234 801 234 5678
  if (phone.startsWith('+234') && phone.length === 14) {
    return `+234 ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`
  }
  return phone
}
