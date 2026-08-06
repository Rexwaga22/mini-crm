#!/usr/bin/env node
/**
 * Gold (XAU/USD) structural signal scanner — Smart Money Concepts / ICT style.
 *
 * Fetches recent OHLC candles from Twelve Data, tracks swing highs/lows to
 * establish the prevailing structure, and flags a Break of Structure (BOS,
 * continuation) or Change of Character (CHoCH, reversal) on the most recently
 * closed candle. When one fires, it emits a buy/sell setup with an entry,
 * stop-loss (beyond the invalidating swing point) and take-profit (based on
 * the --rr risk:reward multiple).
 *
 * This is a technical-analysis heuristic for educational use — NOT financial
 * advice, and not a guarantee of future performance. Always confirm on your
 * own charts and manage risk accordingly.
 *
 * Usage:
 *   TWELVEDATA_API_KEY=xxx node scripts/gold-structure-scanner.mjs \
 *     [--symbol XAU/USD] [--interval 15min] [--rr 2] [--swing-strength 2] [--outputsize 200]
 *
 * Output: a single JSON object on stdout.
 */

function parseArgs(argv) {
  const args = { symbol: 'XAU/USD', interval: '15min', rr: 2, swingStrength: 2, outputsize: 200 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--symbol') args.symbol = argv[++i]
    else if (arg === '--interval') args.interval = argv[++i]
    else if (arg === '--rr') args.rr = parseFloat(argv[++i])
    else if (arg === '--swing-strength') args.swingStrength = parseInt(argv[++i], 10)
    else if (arg === '--outputsize') args.outputsize = parseInt(argv[++i], 10)
  }
  return args
}

async function fetchCandles({ symbol, interval, outputsize, apiKey }) {
  const url = new URL('https://api.twelvedata.com/time_series')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('interval', interval)
  url.searchParams.set('outputsize', String(outputsize))
  url.searchParams.set('apikey', apiKey)

  const res = await fetch(url)
  const body = await res.json()

  if (body.status === 'error' || !Array.isArray(body.values)) {
    throw new Error(`Twelve Data error: ${body.message ?? res.status}`)
  }

  // Twelve Data returns most-recent-first; we want oldest-first for scanning.
  return body.values
    .map(v => ({
      time: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .reverse()
}

function computeATR(candles, period = 14) {
  const trs = []
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i]
    const prev = candles[i - 1]
    trs.push(Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close),
    ))
  }
  const recent = trs.slice(-period)
  return recent.reduce((a, b) => a + b, 0) / recent.length
}

// Fractal swing detection: a candle is a swing high/low if it's the extreme
// among `strength` candles on either side.
function findRawSwings(candles, strength) {
  const swings = []
  for (let i = strength; i < candles.length - strength; i++) {
    const window = candles.slice(i - strength, i + strength + 1)
    const isHigh = window.every(c => c.high <= candles[i].high)
    const isLow = window.every(c => c.low >= candles[i].low)
    if (isHigh) swings.push({ index: i, type: 'high', price: candles[i].high, time: candles[i].time })
    if (isLow) swings.push({ index: i, type: 'low', price: candles[i].low, time: candles[i].time })
  }
  return swings
}

// Collapse consecutive same-type swings into a clean alternating zigzag,
// keeping the most extreme point of each run.
function toZigzag(rawSwings) {
  const zigzag = []
  for (const swing of rawSwings) {
    const last = zigzag[zigzag.length - 1]
    if (!last || last.type !== swing.type) {
      zigzag.push(swing)
    } else if (
      (swing.type === 'high' && swing.price >= last.price) ||
      (swing.type === 'low' && swing.price <= last.price)
    ) {
      zigzag[zigzag.length - 1] = swing
    }
  }
  return zigzag
}

function determineBias(zigzag) {
  const highs = zigzag.filter(s => s.type === 'high').slice(-2)
  const lows = zigzag.filter(s => s.type === 'low').slice(-2)
  if (highs.length === 2 && lows.length === 2) {
    const higherHigh = highs[1].price > highs[0].price
    const higherLow = lows[1].price > lows[0].price
    const lowerHigh = highs[1].price < highs[0].price
    const lowerLow = lows[1].price < lows[0].price
    if (higherHigh && higherLow) return 'bullish'
    if (lowerHigh && lowerLow) return 'bearish'
  }
  return 'ranging'
}

// A liquidity sweep: the candle before the break wicked beyond the swing
// point but closed back on the other side (a stop-hunt before the real move).
function detectLiquiditySweep(candles, breakIndex, swing) {
  const prev = candles[breakIndex - 1]
  if (!prev) return false
  if (swing.type === 'high') return prev.high > swing.price && prev.close < swing.price
  return prev.low < swing.price && prev.close > swing.price
}

function scan({ candles, zigzag, atr, rr }) {
  const lastIndex = candles.length - 1
  const lastCandle = candles[lastIndex]
  const bias = determineBias(zigzag)

  const lastHigh = [...zigzag].reverse().find(s => s.type === 'high')
  const lastLow = [...zigzag].reverse().find(s => s.type === 'low')

  const buffer = 0.25 * atr
  let event = null
  let direction = null
  let brokenSwing = null
  let invalidatingSwing = null

  // Bullish break: close above the last swing high.
  if (lastHigh && lastCandle.close > lastHigh.price && lastHigh.index < lastIndex) {
    direction = 'buy'
    event = bias === 'bearish' || bias === 'ranging' ? 'CHoCH' : 'BOS'
    brokenSwing = lastHigh
    invalidatingSwing = lastLow
  }
  // Bearish break: close below the last swing low. (Only if no bullish break already found on this candle.)
  if (!direction && lastLow && lastCandle.close < lastLow.price && lastLow.index < lastIndex) {
    direction = 'sell'
    event = bias === 'bullish' || bias === 'ranging' ? 'CHoCH' : 'BOS'
    brokenSwing = lastLow
    invalidatingSwing = lastHigh
  }

  if (!direction || !invalidatingSwing) {
    return { bias, event: null, direction: null, currentPrice: lastCandle.close, lastCandleTime: lastCandle.time }
  }

  // The break is always evaluated against the latest closed candle; callers
  // scanning on a loop should de-dupe on `lastCandleTime` to avoid re-alerting
  // the same break on every poll until a new candle closes.
  const entry = lastCandle.close
  const stopLoss = direction === 'buy'
    ? invalidatingSwing.price - buffer
    : invalidatingSwing.price + buffer
  const risk = Math.abs(entry - stopLoss)
  const takeProfit = direction === 'buy' ? entry + risk * rr : entry - risk * rr
  const liquiditySweepDetected = detectLiquiditySweep(candles, lastIndex, brokenSwing)

  return {
    bias,
    event,
    direction,
    currentPrice: lastCandle.close,
    lastCandleTime: lastCandle.time,
    entry: round(entry),
    stopLoss: round(stopLoss),
    takeProfit: round(takeProfit),
    riskRewardRatio: rr,
    brokenStructureLevel: round(brokenSwing.price),
    brokenStructureType: brokenSwing.type,
    invalidatingSwingLevel: round(invalidatingSwing.price),
    liquiditySweepDetected,
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = process.env.TWELVEDATA_API_KEY
  if (!apiKey) {
    console.error('TWELVEDATA_API_KEY is not set.')
    process.exit(1)
  }

  const candles = await fetchCandles({ ...args, apiKey })
  if (candles.length < args.swingStrength * 2 + 20) {
    console.error('Not enough candles returned to compute structure.')
    process.exit(1)
  }

  const atr = computeATR(candles)
  const rawSwings = findRawSwings(candles, args.swingStrength)
  const zigzag = toZigzag(rawSwings)

  const result = scan({ candles, zigzag, atr, rr: args.rr })

  console.log(JSON.stringify({
    symbol: args.symbol,
    interval: args.interval,
    scannedAt: new Date().toISOString(),
    disclaimer: 'Educational technical analysis output — not financial advice.',
    ...result,
  }, null, 2))
}

export { findRawSwings, toZigzag, determineBias, scan, computeATR, round }

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err.message)
    process.exit(1)
  })
}
