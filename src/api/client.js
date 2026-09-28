/**
 * HTTP klient — fetch ustiga yupqa qatlam.
 * Vite dev-serverida /api proxy orqali backendga uzatiladi (vite.config.js).
 * Production uchun .env da VITE_API_BASE ni belgilang.
 */

const BASE = import.meta.env.VITE_API_BASE ?? ''

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

/** null/undefined/'' qiymatlarni tashlab yuboradi */
function toQuery(params = {}) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    sp.append(key, String(value))
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

/**
 * @param {string} path
 * @param {object} [options]
 * @param {object} [options.params]  query parametrlar
 * @param {'GET'|'POST'|'PATCH'} [options.method]
 * @param {object} [options.body]    JSON tanasi (POST/PATCH uchun)
 * @param {AbortSignal} [options.signal]
 */
export async function request(path, options = {}) {
  const { params, method = 'GET', body, signal } = options
  const url = BASE + path + toQuery(params)

  const headers = {
    accept: 'application/json',
    'Accept-Language': 'uz,en-US;q=0.9,en;q=0.8,ru;q=0.7'
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, {
      method,
      signal,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Server bilan aloqa yo\'q', 0)
  }

  // Xato javobida ham tanani o'qishga urinamiz — backend sababni yozishi mumkin
  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : null
    throw new ApiError(detail || `So'rov bajarilmadi (${res.status})`, res.status, payload)
  }

  return payload
}

export { ApiError }
