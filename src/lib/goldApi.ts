const GOLD_API_BASE = 'https://www.goldapi.io/api'

export interface GoldPrice {
  metal: string
  currency: string
  price: number
  prevClosePrice: number
  change: number
  changePercent: number
  pricePerGram24k: number
  timestamp: number
}

export class GoldApiError extends Error {}

/**
 * Fetches the live XAU/USD spot price from GoldAPI.io.
 * Requires GOLDAPI_KEY to be set server-side — never expose this key to the client.
 */
export async function getGoldPrice(): Promise<GoldPrice> {
  const apiKey = process.env.GOLDAPI_KEY
  if (!apiKey) {
    throw new GoldApiError('GOLDAPI_KEY is not configured')
  }

  const response = await fetch(`${GOLD_API_BASE}/XAU/USD`, {
    headers: {
      'x-access-token': apiKey,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new GoldApiError(`GoldAPI request failed with status ${response.status}`)
  }

  const data = await response.json()

  return {
    metal: data.metal,
    currency: data.currency,
    price: data.price,
    prevClosePrice: data.prev_close_price,
    change: data.ch,
    changePercent: data.chp,
    pricePerGram24k: data.price_gram_24k,
    timestamp: data.timestamp,
  }
}
