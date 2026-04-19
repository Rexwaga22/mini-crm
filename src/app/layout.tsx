import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AGU CRM — Internal Lead Management',
  description: 'Internal CRM for managing and distributing sales leads across your organisation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
