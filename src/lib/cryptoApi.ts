const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export interface CryptoMover {
  id: string
  symbol: string
  name: string
  price: number
  changePercent24h: number
}

export class CryptoApiError extends Error {}

interface CoinGeckoMarketEntry {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number | null
}

/**
 * Fetches top-market-cap coins from CoinGecko's free public markets endpoint
 * (no API key required) and splits them into 24h gainers and losers.
 */
export async function getCryptoMovers(limit = 5): Promise<{ gainers: CryptoMover[]; losers: CryptoMover[] }> {
  const url = new URL(`${COINGECKO_BASE}/coins/markets`)
  url.searchParams.set('vs_currency', 'usd')
  url.searchParams.set('order', 'market_cap_desc')
  url.searchParams.set('per_page', '100')
  url.searchParams.set('page', '1')
  url.searchParams.set('price_change_percentage', '24h')
  url.searchParams.set('sparkline', 'false')

  const response = await fetch(url, { next: { revalidate: 120 } })

  if (!response.ok) {
    throw new CryptoApiError(`CoinGecko request failed with status ${response.status}`)
  }

  const data: CoinGeckoMarketEntry[] = await response.json()

  const movers: CryptoMover[] = data
    .filter((coin) => typeof coin.price_change_percentage_24h === 'number')
    .map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      changePercent24h: coin.price_change_percentage_24h as number,
    }))

  const sorted = [...movers].sort((a, b) => b.changePercent24h - a.changePercent24h)

  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
  }
}
