import { redirect } from 'next/navigation'

export default function RootPage() {
  // Middleware handles the redirect; this is a fallback
  redirect('/login')
}
