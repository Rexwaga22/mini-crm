import type { ContactStatus } from '@/types/database'

const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  'Not Yet Contacted':  { label: 'Not Yet Contacted',  className: 'badge badge-neutral' },
  'Called':             { label: 'Called',             className: 'badge badge-primary' },
  'Callback Scheduled': { label: 'Callback Scheduled', className: 'badge badge-purple' },
  'Unreachable':        { label: 'Unreachable',        className: 'badge badge-amber' },
  'Connected':          { label: 'Connected',          className: 'badge badge-green' },
  'Do Not Contact':     { label: 'Do Not Contact',     className: 'badge badge-red' },
}

export default function StatusBadge({ status }: { status: ContactStatus }) {
  const config = statusConfig[status] ?? { label: status, className: 'badge badge-neutral' }
  return <span className={config.className}>{config.label}</span>
}
