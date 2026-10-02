import { ref, reactive, computed, watch } from 'vue'
import { fetchLaws } from '@/api/laws'

/**
 * Qonunchilik yangiliklari ro'yxati (GET /api/v1/laws).
 * Tenderlardan farqi: saralash yo'q (doim yangi → eski), qiziqish belgisi yo'q,
 * filtrlar faqat matn qidiruvi va sana oralig'i.
 */

export const DEFAULT_LAW_FILTERS = Object.freeze({
  q: '',
  dateFrom: '',
  dateTo: ''
})

export function useLaws() {
  const filters  = reactive({ ...DEFAULT_LAW_FILTERS })
  const page     = ref(1)
  const pageSize = ref(20)

  const items   = ref([])
  const total   = ref(0)
  const pages   = ref(1)
  const loading = ref(false)
  const error   = ref(null)
  const loaded  = ref(false)   // bir marta ham yuklanganmi

  let controller = null
  let debounceId = null

  const totalPages = computed(() => Math.max(1, pages.value))

  const activeFilterCount = computed(() =>
    (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)
  )

  function buildParams() {
    const q = filters.q.trim()
    return {
      q:         q || undefined,
      // API sanani vaqtsiz kutadi: 2026-09-01
      date_from: filters.dateFrom || undefined,
      date_to:   filters.dateTo   || undefined,
      page:      page.value,
      page_size: pageSize.value
    }
  }

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null

    try {
      const data = await fetchLaws(buildParams(), signal)
      items.value = data?.items ?? []
      total.value = data?.total ?? items.value.length
      pages.value = data?.pages ?? 1
      loaded.value = true

      if (data?.page && data.page !== page.value) page.value = data.page
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e.message
      items.value = []
      total.value = 0
      pages.value = 1
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  function apply() {
    page.value = 1
    load()
  }

  function applyDebounced(delay = 350) {
    clearTimeout(debounceId)
    debounceId = setTimeout(apply, delay)
  }

  function goTo(n) {
    const target = Math.min(Math.max(1, n), totalPages.value)
    if (target === page.value) return
    page.value = target
    load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    Object.assign(filters, DEFAULT_LAW_FILTERS)
    apply()
  }

  watch(pageSize, apply)

  return {
    filters, page, pageSize,
    items, total, pages, loading, error, loaded,
    totalPages, activeFilterCount,
    load, apply, applyDebounced, goTo, reset
  }
}
