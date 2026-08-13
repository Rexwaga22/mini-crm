const TWELVEDATA_BASE = 'https://api.twelvedata.com'

const MAJOR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'EUR/JPY', 'GBP/JPY',
]

export interface ForexMover {
  symbol: string
  price: number
  changePercent: number
}

export class ForexApiError extends Error {}

interface TwelveDataQuote {
  symbol: string
  close: string
  percent_change: string
  status?: string
}

/**
 * Fetches live quotes for a fixed set of major FX pairs from Twelve Data
 * (reuses TWELVEDATA_API_KEY) and splits them into daily gainers and losers.
 */
export async function getForexMovers(limit = 5): Promise<{ gainers: ForexMover[]; losers: ForexMover[] }> {
  const apiKey = process.env.TWELVEDATA_API_KEY
  if (!apiKey) {
    throw new ForexApiError('TWELVEDATA_API_KEY is not configured')
  }

  const url = new URL(`${TWELVEDATA_BASE}/quote`)
  url.searchParams.set('symbol', MAJOR_PAIRS.join(','))
  url.searchParams.set('apikey', apiKey)

  const response = await fetch(url, { next: { revalidate: 120 } })

  if (!response.ok) {
    throw new ForexApiError(`Twelve Data request failed with status ${response.status}`)
  }

  const data = await response.json()
  const quotesBySymbol: Record<string, TwelveDataQuote> =
    MAJOR_PAIRS.length === 1 ? { [MAJOR_PAIRS[0]]: data } : data

  const movers: ForexMover[] = MAJOR_PAIRS
    .map((symbol) => quotesBySymbol[symbol])
    .filter((quote): quote is TwelveDataQuote => Boolean(quote) && quote.status !== 'error' && quote.percent_change !== undefined)
    .map((quote) => ({
      symbol: quote.symbol,
      price: parseFloat(quote.close),
      changePercent: parseFloat(quote.percent_change),
    }))

  if (movers.length === 0) {
    throw new ForexApiError('Twelve Data returned no usable forex quotes')
  }

  const sorted = [...movers].sort((a, b) => b.changePercent - a.changePercent)

  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
  }
}
