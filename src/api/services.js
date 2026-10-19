import { request } from './client'

/**
 * Xizmatlar katalogi — AI moslik shu ro'yxat asosida hisoblanadi.
 *
 * Katalog har kuni 07:45 da identity-uz.com dan avtomatik yangilanadi,
 * admin qo'lda ham qo'shishi mumkin. Xizmat qo'shilganda yoki o'zgarganda
 * fonda hamma tenderlar qayta baholanadi (bir soatgacha davom etishi mumkin).
 */

/** GET /api/v1/services — har birida matches_count bilan */
export function fetchServices(signal) {
  return request('/api/v1/services', { signal })
}

/** POST /api/v1/services — qo'shish, fonda avtomatik skoring boshlanadi */
export function createService(body, signal) {
  return request('/api/v1/services', { method: 'POST', body, signal })
}

/** PUT /api/v1/services/{id} — tahrirlash, o'zgarsa qayta skoring */
export function updateService(id, body, signal) {
  return request(`/api/v1/services/${id}`, { method: 'PUT', body, signal })
}

/** DELETE /api/v1/services/{id} */
export function deleteService(id, signal) {
  return request(`/api/v1/services/${id}`, { method: 'DELETE', signal })
}

/**
 * GET /api/v1/services/{id}/matches — bitta xizmatga mos tenderlar.
 * /items bilan bir xil filtrlarni qabul qiladi.
 */
export function fetchServiceMatches(id, params, signal) {
  return request(`/api/v1/services/${id}/matches`, { params, signal })
}
