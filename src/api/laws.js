import { request } from './client'

/**
 * GET /api/v1/laws — lex.uz'dan yig'ilgan yangi qonun-hujjatlar.
 *
 * Tartib doim yangi → eski (hujjat sanasi bo'yicha), saralash parametri yo'q.
 * Hujjatning o'zi lex.uz'da ochiladi (`url` / `pdf_url`).
 *
 * @param {{q?: string, date_from?: string, date_to?: string, page?: number, page_size?: number}} params
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number, pages: number}>}
 */
export function fetchLaws(params, signal) {
  return request('/api/v1/laws', { params, signal })
}
