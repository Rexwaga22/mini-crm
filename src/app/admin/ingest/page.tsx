import { createClient } from '@/utils/supabase/server'
import IngestClient from './IngestClient'

export default async function IngestPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <IngestClient adminId={user?.id ?? ''} />
  )
}
