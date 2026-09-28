import { request } from './client'

/**
 * GET /api/v1/items — ro'yxat, qidiruv va filtrlash, hammasi bitta endpointda.
 *
 * `q` berilsa — 3 tilda (uz lotin, uz kirill, rus) ma'no bo'yicha qidiruv,
 * standart tartib `relevance`. `q`siz — oddiy ro'yxat, standart tartib `newest`.
 * Faqat aktiv tenderlar qaytadi — muddati tugaganlari arxivga o'tadi.
 *
 * @param {{
 *   q?: string, category?: string, domain?: string,
 *   interest?: 'all'|'new'|'interested'|'not_interested',
 *   price_min?: string|number, price_max?: string|number,
 *   date_from?: string, date_to?: string,
 *   sort?: 'relevance'|'newest'|'oldest'|'price_asc'|'price_desc',
 *   page?: number, page_size?: number
 * }} params
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number, pages: number}>}
 */
export function fetchItems(params, signal) {
  return request('/api/v1/items', { params, signal })
}

/**
 * GET /api/v1/items/stats — tab sonlari. Front o'zi hisoblamaydi.
 * @param {{domain?: string, category?: string, ending_days?: number}} params
 * @returns {Promise<{total, new, interested, not_interested, ending_soon, added_24h, ending_days}>}
 */
export function fetchStats(params, signal) {
  return request('/api/v1/items/stats', { params, signal })
}

/**
 * PATCH /api/v1/items/{id}/interest — xodim belgisi, bazada saqlanadi.
 * @param {number} id
 * @param {'new'|'interested'|'not_interested'} interest  'new' = belgini olib tashlash
 */
export function updateInterest(id, interest, signal) {
  return request(`/api/v1/items/${id}/interest`, {
    method: 'PATCH',
    body: { interest },
    signal
  })
}

/** GET /api/v1/sources — manbalar ro'yxati. `domain` filtri qiymatlari shu yerdan */
export function fetchSources(signal) {
  return request('/api/v1/sources', { signal })
}

/**
 * POST /api/v1/collect — qo'lda yig'ishni boshlash. Fonda ishlaydi, javob darhol qaytadi.
 * @param {string} [source]  bitta domen; bo'sh = barcha saytlar
 */
export function triggerCollect(source, signal) {
  return request('/api/v1/collect', {
    method: 'POST',
    params: source ? { source } : undefined,
    signal
  })
}

/**
 * GET /api/v1/collect/status — yig'ish jarayoni holati.
 * @returns {Promise<{running: boolean, runs: Array<{id, domain, started_at, finished_at, status, items_count, error}>}>}
 */
export function fetchCollectStatus(limit = 12, signal) {
  return request('/api/v1/collect/status', { params: { limit }, signal })
}

/** GET /health — backend holati: { status, db, embedder } */
export function fetchHealth(signal) {
  return request('/health', { signal })
}
