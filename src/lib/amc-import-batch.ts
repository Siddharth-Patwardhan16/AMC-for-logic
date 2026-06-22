import type { AmcImportRow } from '@/lib/amc-import-schema'

export const AMC_IMPORT_BATCH_SIZE = 8

export type AmcImportBatchResult = {
  created: number
  skipped: number
  errors: string[]
  total: number
}

export type AmcImportProgress = {
  done: number
  total: number
  batch: number
  batchCount: number
}

type ImportBatchFn = (rows: AmcImportRow[]) => Promise<AmcImportBatchResult>

/** Import large spreadsheets in small batches to avoid serverless timeouts. */
export async function importAmcRowsInBatches(
  rows: AmcImportRow[],
  importBatch: ImportBatchFn,
  options?: {
    batchSize?: number
    onProgress?: (progress: AmcImportProgress) => void
  }
): Promise<AmcImportBatchResult> {
  const batchSize = options?.batchSize ?? AMC_IMPORT_BATCH_SIZE
  const batchCount = Math.ceil(rows.length / batchSize)

  const aggregate: AmcImportBatchResult = {
    created: 0,
    skipped: 0,
    errors: [],
    total: rows.length,
  }

  for (let i = 0; i < rows.length; i += batchSize) {
    const batchIndex = Math.floor(i / batchSize) + 1
    const batch = rows.slice(i, i + batchSize)

    options?.onProgress?.({
      done: i,
      total: rows.length,
      batch: batchIndex,
      batchCount,
    })

    try {
      const result = await importBatch(batch)
      aggregate.created += result.created
      aggregate.skipped += result.skipped
      aggregate.errors.push(...result.errors)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import batch failed'
      aggregate.errors.push(`Batch ${batchIndex}: ${message}`)
    }

    options?.onProgress?.({
      done: Math.min(i + batchSize, rows.length),
      total: rows.length,
      batch: batchIndex,
      batchCount,
    })
  }

  return aggregate
}
