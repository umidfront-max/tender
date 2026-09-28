import { ref } from 'vue'
import { fetchStats } from '@/api/tenders'

/**
 * GET /api/v1/items/stats — tab sonlari va ko'rsatkichlar.
 * Front o'zi hisoblamaydi: sonlar butun baza bo'yicha, joriy sahifa bo'yicha emas.
 * Ro'yxat har safar yangilanganda bu ham qayta so'raladi.
 */

const EMPTY = Object.freeze({
  total: 0, new: 0, interested: 0, not_interested: 0,
  ending_soon: 0, added_24h: 0, ending_days: 3
})

export function useStats() {
  const stats   = ref({ ...EMPTY })
  const loading = ref(false)
  const error   = ref(null)

  let controller = null

  /**
   * @param {{domain?: string, category?: string, ending_days?: number}} params
   * Stats `interest` va `q` ni qabul qilmaydi — sonlar tablardan qat'i nazar bir xil
   */
  async function load(params = {}) {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null

    try {
      stats.value = await fetchStats(params, signal)
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e.message
      stats.value = { ...EMPTY }
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  /**
   * Belgi o'zgarganda sonlarni darhol joyida tuzatamiz —
   * server javobini kutmasdan tab raqamlari sakrab turmasligi uchun.
   * @param {'new'|'interested'|'not_interested'} from
   * @param {'new'|'interested'|'not_interested'} to
   */
  function shift(from, to) {
    if (from === to) return
    const s = { ...stats.value }
    if (s[from] > 0) s[from] -= 1
    s[to] += 1
    stats.value = s
  }

  return { stats, loading, error, load, shift }
}
