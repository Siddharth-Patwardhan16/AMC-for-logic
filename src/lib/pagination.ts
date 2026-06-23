import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 24

export const paginationFields = {
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export function paginationArgs(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

export function resolvePagination(input?: { page?: number; pageSize?: number }) {
  const page = input?.page ?? 1
  const pageSize = input?.pageSize ?? DEFAULT_PAGE_SIZE
  return { page, pageSize, ...paginationArgs(page, pageSize) }
}
