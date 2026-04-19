'use client'

import { useState, useRef } from 'react'
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { parseCsvFile, type ParsedLead } from '@/lib/csv'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function IngestClient({ adminId }: { adminId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    valid: ParsedLead[]
    flagged: ParsedLead[]
    duplicates: ParsedLead[]
    total: number
  } | null>(null)

  async function handleFile(file: File) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.')
      return
    }
    setFile(file)
    setParsing(true)
    try {
      const res = await parseCsvFile(file)
      setResults(res)
    } catch (err) {
      alert('Failed to parse CSV file.')
    } finally {
      setParsing(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  async function confirmUpload() {
    if (!results || results.valid.length === 0) return
    setUploading(true)
    
    // 1. Create batch record
    const batchId = `BATCH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    
    const { error: batchErr } = await supabase.from('csv_imports').insert({
      batch_id: batchId,
      imported_by: adminId,
      import_type: 'leads',
      total_rows: results.total,
      valid_rows: results.valid.length,
      duplicate_rows: results.duplicates.length,
      flagged_rows: results.flagged.length,
      status: 'pending' // Usually 'processing' and then 'complete', doing it sync so 'complete' soon
    })

    if (batchErr) {
      alert(`Failed to create import record: ${batchErr.message}`)
      setUploading(false)
      return
    }

    // 2. Insert Valid Leads (Ignoring flagged/duplicates for now, or storing them elsewhere)
    const records = results.valid.map(l => ({
      name: l.name,
      phone_number: l.normalised_phone!, // we know it's valid here
      source: l.source ?? 'CSV Upload',
      interest_level: l.interest_level,
      import_batch_id: batchId,
      created_by: adminId,
      contact_status: 'Not Yet Contacted' as const
    }))

    // Batch insert
    // Note: Suapbase limits inserts, maybe chunk if > 1000
    const chunkSize = 500
    let numInserted = 0
    let hasError = false
    
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const { error: insertErr } = await supabase.from('leads').insert(chunk)
      if (insertErr) {
        hasError = true
        console.error(insertErr)
      } else {
        numInserted += chunk.length
      }
    }

    await supabase.from('csv_imports').update({
      status: hasError ? 'failed' : 'complete',
      completed_at: new Date().toISOString()
    }).eq('batch_id', batchId)
    
    setUploading(false)
    if (!hasError) {
      router.push('/admin/leads')
    } else {
      alert('Some leads failed to upload. Check console for details.')
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Ingest Leads</h1>
        <p className="page-subtitle">Upload formatted CSV files to import new sales leads.</p>
      </div>

      {!results && (
        <div 
          className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="sr-only" 
            ref={fileInputRef}
            onChange={e => e.target.files && handleFile(e.target.files[0])}
          />
          {parsing ? (
            <>
              <RefreshCw className="upload-zone-icon" size={48} style={{ animation: 'skeleton-pulse 1s linear infinite' }} />
              <div className="upload-zone-label">Parsing CSV...</div>
            </>
          ) : (
            <>
              <UploadCloud className="upload-zone-icon" size={48} />
              <div className="upload-zone-label">Click to upload or drag and drop</div>
              <div className="upload-zone-hint">CSV files only. Must include a 'phone_number' column.</div>
            </>
          )}
        </div>
      )}

      {results && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Upload Summary</h2>
            <div className="text-label text-muted">{file?.name}</div>
          </div>

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-6)' }}>
            <div className="stat-card" style={{ background: 'var(--color-green-bg)', borderColor: 'var(--color-green)' }}>
              <div className="stat-label" style={{ color: 'var(--color-green)' }}>Valid Rows <CheckCircle size={14}/></div>
              <div className="stat-value" style={{ color: 'var(--color-green)' }}>{results.valid.length}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--color-amber-bg)', borderColor: 'var(--color-amber)' }}>
              <div className="stat-label" style={{ color: 'var(--color-amber)' }}>Flagged (Invalid Phone) <AlertCircle size={14}/></div>
              <div className="stat-value" style={{ color: 'var(--color-amber)' }}>{results.flagged.length}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--color-background)', borderColor: 'var(--color-outline-variant)' }}>
              <div className="stat-label text-muted">Duplicates in CSV <FileType size={14}/></div>
              <div className="stat-value">{results.duplicates.length}</div>
            </div>
          </div>

          {results.flagged.length > 0 && (
            <div className="inactivity-panel" style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)', marginBottom: 'var(--space-6)' }}>
              <strong>Note:</strong> {results.flagged.length} row(s) have invalid or missing phone numbers and will be skipped. Only proper Nigerian numbers (+234, 080...) are accepted.
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setResults(null)}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={confirmUpload}
              disabled={uploading || results.valid.length === 0}
            >
              {uploading ? 'Importing...' : `Import ${results.valid.length} Leads`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
