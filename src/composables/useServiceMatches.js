import { ref, computed } from 'vue'
import { fetchServiceMatches } from '@/api/services'
import { MATCH_THRESHOLD } from './useTenders'

/**
 * Bitta xizmatga mos tenderlar — GET /api/v1/services/{id}/matches.
 *
 * /items bilan bir xil filtrlarni qabul qiladi, lekin minimal moslik bu yerda
 * `min_score` deb ataladi (/items da `min_match`). Elementlarda match_score va
 * ai_comment aynan shu xizmatga nisbatan keladi.
 */
export function useServiceMatches() {
  const service  = ref(null)   // tanlangan xizmat; null = ro'yxat ko'rinadi
  const page     = ref(1)
  const pageSize = ref(12)

  const items   = ref([])
  const total   = ref(0)
  const pages   = ref(1)
  const loading = ref(false)
  const error   = ref(null)

  const totalPages = computed(() => Math.max(1, pages.value))

  let controller = null

  async function load() {
    if (!service.value) return

    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null

    try {
      const data = await fetchServiceMatches(service.value.id, {
        min_score: MATCH_THRESHOLD,
        sort: 'relevance',
        page: page.value,
        page_size: pageSize.value
      }, signal)

      // Javob /items kabi sahifalangan yoki oddiy massiv bo'lishi mumkin
      items.value = Array.isArray(data) ? data : (data?.items ?? [])
      total.value = data?.total ?? items.value.length
      pages.value = data?.pages ?? 1
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e.message
      items.value = []
      total.value = 0
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  function open(s) {
    service.value = s
    page.value = 1
    items.value = []
    load()
  }

  function close() {
    controller?.abort()
    service.value = null
    items.value = []
    loading.value = false
    error.value = null
  }

  function goTo(n) {
    const target = Math.min(Math.max(1, n), totalPages.value)
    if (target === page.value) return
    page.value = target
    load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    service, page, pageSize, items, total, totalPages, loading, error,
    load, open, close, goTo
  }
}
