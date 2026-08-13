import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'

export interface MoverEntry {
  symbol: string
  name?: string
  price: number
  changePercent: number
}

interface MoversCardProps {
  title: string
  subtitle: string
  Icon: LucideIcon
  gainers: MoverEntry[]
  losers: MoverEntry[]
  formatPrice: (price: number) => string
  emptyLabel: string
  emptyBody: string
}

function MoverRow({ entry, formatPrice }: { entry: MoverEntry; formatPrice: (price: number) => string }) {
  const isPositive = entry.changePercent >= 0
  return (
    <div className="mover-row">
      <div className="mover-id">
        <span className="mover-symbol">{entry.symbol}</span>
        {entry.name && <span className="mover-name">{entry.name}</span>}
      </div>
      <div className="mover-figures">
        <span className="mover-price">{formatPrice(entry.price)}</span>
        <span className="mover-change" style={{ color: isPositive ? 'var(--color-green)' : 'var(--color-red)' }}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {isPositive ? '+' : ''}
          {entry.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function MoversCard({ title, subtitle, Icon, gainers, losers, formatPrice, emptyLabel, emptyBody }: MoversCardProps) {
  const hasData = gainers.length > 0 || losers.length > 0

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon size={18} />
            {title}
          </span>
        </h2>
        <span className="text-label text-muted">{subtitle}</span>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon size={40} /></div>
          <div className="empty-state-title">{emptyLabel}</div>
          <div className="empty-state-body">{emptyBody}</div>
        </div>
      ) : (
        <div className="movers-grid">
          <div>
            <div className="movers-col-title text-green">
              <TrendingUp size={14} />
              Gainers
            </div>
            <div className="movers-list">
              {gainers.map((entry) => (
                <MoverRow key={entry.symbol} entry={entry} formatPrice={formatPrice} />
              ))}
            </div>
          </div>
          <div>
            <div className="movers-col-title text-red">
              <TrendingDown size={14} />
              Losers
            </div>
            <div className="movers-list">
              {losers.map((entry) => (
                <MoverRow key={entry.symbol} entry={entry} formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
