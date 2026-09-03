/**
 * HTTP klient — fetch ustiga yupqa qatlam.
 * Vite dev-serverida /api proxy orqali backendga uzatiladi (vite.config.js).
 * Production uchun .env da VITE_API_BASE ni belgilang.
 */

const BASE = import.meta.env.VITE_API_BASE ?? ''

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
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
 * @param {object} [params]  query parametrlar
 * @param {AbortSignal} [signal]  so'rovni bekor qilish uchun
 */
export async function request(path, params, signal) {
  const url = BASE + path + toQuery(params)

  let res
  try {
    res = await fetch(url, {
      signal,
      headers: {
        accept: 'application/json',
        'Accept-Language': 'uz,en-US;q=0.9,en;q=0.8,ru;q=0.7'
      }
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Server bilan aloqa yo\'q', 0)
  }

  if (!res.ok) {
    throw new ApiError(`So'rov bajarilmadi (${res.status})`, res.status)
  }

  return res.json()
}

export { ApiError }
