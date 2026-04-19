import Papa from 'papaparse'
import { normalisePhone } from './phone'

export interface CsvRow {
  phone_number: string
  name?: string
  source?: string
  interest_level?: string
}

export interface ParsedLead {
  phone_number: string
  normalised_phone: string | null
  name: string | null
  source: string | null
  interest_level: string | null
  status: 'valid' | 'flagged' | 'duplicate'
  flag_reason?: string
  row_index: number
}

export interface CsvParseResult {
  valid: ParsedLead[]
  flagged: ParsedLead[]
  duplicates: ParsedLead[]
  total: number
}

/** Parse a CSV File object into categorised leads */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
      complete(results) {
        const seenPhones = new Set<string>()
        const valid: ParsedLead[] = []
        const flagged: ParsedLead[] = []
        const duplicates: ParsedLead[] = []

        results.data.forEach((row, idx) => {
          const rawPhone =
            row['phone_number'] ||
            row['phone'] ||
            row['mobile'] ||
            row['contact'] ||
            ''

          const parsed: ParsedLead = {
            phone_number: rawPhone.trim(),
            normalised_phone: null,
            name: row['name']?.trim() || row['full_name']?.trim() || null,
            source: row['source']?.trim() || null,
            interest_level: row['interest_level']?.trim() || row['interest']?.trim() || null,
            status: 'valid',
            row_index: idx + 2, // +2 for header + 1-index
          }

          if (!rawPhone.trim()) {
            parsed.status = 'flagged'
            parsed.flag_reason = 'Missing phone number'
            flagged.push(parsed)
            return
          }

          const normalised = normalisePhone(rawPhone.trim())
          if (!normalised) {
            parsed.status = 'flagged'
            parsed.flag_reason = 'Unrecognised phone format'
            flagged.push(parsed)
            return
          }

          parsed.normalised_phone = normalised

          // Check duplicates within file
          if (seenPhones.has(normalised)) {
            parsed.status = 'duplicate'
            parsed.flag_reason = 'Duplicate within CSV — first-row wins'
            duplicates.push(parsed)
            return
          }

          seenPhones.add(normalised)
          valid.push(parsed)
        })

        resolve({ valid, flagged, duplicates, total: results.data.length })
      },
      error(err) {
        reject(err)
      },
    })
  })
}

/** Export an array of objects as a CSV download */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    // Download headers-only CSV
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, filename)
    return
  }

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
