import { request } from './client'

/**
 * GET /api/v1/items — ro'yxat, qidiruv va filtrlash, hammasi bitta endpointda.
 *
 * `q` berilsa — 3 tilda (uz lotin, uz kirill, rus) ma'no bo'yicha qidiruv,
 * standart tartib `relevance`. `q`siz — oddiy ro'yxat, standart tartib `newest`.
 * Barcha filtrlar ikkala rejimda ham ishlaydi.
 *
 * @param {{
 *   q?: string, category?: string, domain?: string,
 *   price_min?: string|number, price_max?: string|number,
 *   date_from?: string, date_to?: string,
 *   sort?: 'relevance'|'newest'|'oldest'|'price_asc'|'price_desc',
 *   page?: number, page_size?: number
 * }} params
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number, pages: number}>}
 */
export function fetchItems(params, signal) {
  return request('/api/v1/items', params, signal)
}

/** GET /api/v1/sources — manbalar ro'yxati. `domain` filtri qiymatlari shu yerdan */
export function fetchSources(signal) {
  return request('/api/v1/sources', undefined, signal)
}

/** GET /health — backend holati: { status, db, embedder } */
export function fetchHealth(signal) {
  return request('/health', undefined, signal)
}
