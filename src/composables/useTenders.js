import { ref, reactive, computed, watch } from 'vue'
import { fetchItems, updateInterest } from '@/api/tenders'

export const DEFAULT_FILTERS = Object.freeze({
  q: '',
  category: '',
  domains: [],      // bir nechta manba: API ga vergul bilan uzatiladi
  priceMin: '',
  priceMax: '',
  dateFrom: '',
  dateTo: ''
})

/**
 * API qabul qiladigan tartiblash qiymatlari (SortOrder).
 * Bo'sh qiymat — parametr yuborilmaydi va API o'zi tanlaydi:
 * qidiruvda `relevance`, oddiy ro'yxatda `newest`.
 */
export const SORTS = Object.freeze(['relevance', 'newest', 'oldest', 'price_asc', 'price_desc'])

function cloneDefaults() {
  return { ...DEFAULT_FILTERS, domains: [] }
}

/** Tablar: /api/v1/items dagi `interest` filtri qiymatlari */
export const TABS = Object.freeze([
  { value: 'all',            label: 'Hammasi',    icon: 'ti-layout-grid',  count: 'total' },
  { value: 'new',            label: 'Yangi',      icon: 'ti-sparkles',     count: 'new' },
  { value: 'interested',     label: 'Qiziqarli',  icon: 'ti-star',         count: 'interested' },
  { value: 'not_interested', label: 'Qiziqarsiz', icon: 'ti-thumb-down',   count: 'not_interested' }
])

export function useTenders() {
  const filters  = reactive(cloneDefaults())
  const interest = ref('all')   // faol tab
  const sort     = ref('')   // '' = API standarti
  const page     = ref(1)
  const pageSize = ref(12)   // API cheklovi: 1..100

  const items     = ref([])
  const total     = ref(0)
  const pages     = ref(1)
  const loading   = ref(false)
  const error     = ref(null)
  const lastQuery = ref('')  // natijalarni ta'riflash uchun — filters.q emas, aynan yuborilgani

  let controller = null
  let debounceId = null

  const isSearchMode = computed(() => filters.q.trim().length > 0)
  const totalPages   = computed(() => Math.max(1, pages.value))

  /** Faol filtrlar soni — sidebar badge uchun (q hisobga olinmaydi) */
  const activeFilterCount = computed(() =>
    (filters.category ? 1 : 0) +
    (filters.domains.length ? 1 : 0) +
    (filters.priceMin !== '' ? 1 : 0) +
    (filters.priceMax !== '' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0)
  )

  /** Filtrlarni /api/v1/items query parametrlariga aylantiradi */
  function buildParams() {
    const q = filters.q.trim()
    return {
      q:          q || undefined,
      category:   filters.category || undefined,
      // API: bitta 'etender.uzex.uz' yoki bir nechtasi 'a.uz,b.uz'
      domain:     filters.domains.length ? filters.domains.join(',') : undefined,
      // 'all' standart qiymat — yubormaymiz
      interest:   interest.value === 'all' ? undefined : interest.value,
      price_min:  filters.priceMin !== '' ? filters.priceMin : undefined,
      price_max:  filters.priceMax !== '' ? filters.priceMax : undefined,
      date_from:  filters.dateFrom ? `${filters.dateFrom}T00:00:00` : undefined,
      date_to:    filters.dateTo   ? `${filters.dateTo}T23:59:59`   : undefined,
      // Bo'sh bo'lsa yubormaymiz — API standartini qo'llaydi.
      // relevance faqat q bilan ma'noga ega.
      sort:       !sort.value || (sort.value === 'relevance' && !q) ? undefined : sort.value,
      page:       page.value,
      page_size:  pageSize.value
    }
  }

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null

    try {
      const params = buildParams()
      const data = await fetchItems(params, signal)

      items.value = data?.items ?? []
      total.value = data?.total ?? items.value.length
      pages.value = data?.pages ?? 1
      lastQuery.value = params.q ?? ''

      // Server sahifani cheklab qo'ysa (masalan filtr toraysa) — mos holatga keltiramiz
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

  /** Filtr o'zgarganda 1-sahifaga qaytib qayta yuklaydi */
  function apply() {
    page.value = 1
    load()
  }

  /** Qidiruv maydoni uchun — debounce bilan */
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

  /**
   * Tenderga xodim belgisini qo'yadi (PATCH /items/{id}/interest).
   * Optimistik: avval ekranda o'zgaradi, server rad etsa orqaga qaytariladi.
   * @returns {Promise<string>} oldingi holat — stats sonlarini tuzatish uchun
   */
  async function setInterest(item, value) {
    const prev = item.interest ?? 'new'
    if (prev === value) return prev

    item.interest = value
    try {
      await updateInterest(item.id, value)
    } catch (e) {
      item.interest = prev
      throw e
    }

    // Joriy tab bilan mos kelmay qolgan bo'lsa ro'yxatdan chiqaramiz
    if (interest.value !== 'all' && interest.value !== value) {
      const i = items.value.findIndex(x => x.id === item.id)
      if (i !== -1) {
        items.value.splice(i, 1)
        total.value = Math.max(0, total.value - 1)
      }
    }
    return prev
  }

  /** Manbani tanlash/olib tashlash (ko'p tanlov) */
  function toggleDomain(domain) {
    if (!domain) {
      filters.domains = []
    } else {
      const i = filters.domains.indexOf(domain)
      if (i === -1) filters.domains.push(domain)
      else filters.domains.splice(i, 1)
    }
    apply()
  }

  function reset() {
    Object.assign(filters, cloneDefaults())
    syncingSort = sort.value !== ''
    sort.value = ''

    // Tab o'zgarsa uning kuzatuvchisi apply() ni o'zi chaqiradi —
    // aks holda bitta tozalashga ikkita so'rov ketardi
    if (interest.value !== 'all') interest.value = 'all'
    else apply()
  }

  // Foydalanuvchi saralashni o'zgartirsa darhol qayta yuklaymiz.
  // Ichkaridan tuzatilgan qiymat qo'shimcha so'rov keltirib chiqarmasligi kerak.
  let syncingSort = false
  watch(sort, () => {
    if (syncingSort) { syncingSort = false; return }
    apply()
  })

  // Tab almashganda 1-sahifadan qayta yuklaymiz
  watch(interest, apply)

  // Qidiruvdan chiqilganda relevance ma'nosini yo'qotadi — standartga qaytamiz
  watch(isSearchMode, (on) => {
    if (!on && sort.value === 'relevance') {
      syncingSort = true
      sort.value = ''
    }
  })

  return {
    filters, interest, sort, page, pageSize,
    items, total, pages, loading, error, lastQuery,
    isSearchMode, totalPages, activeFilterCount,
    load, apply, applyDebounced, goTo, toggleDomain, setInterest, reset
  }
}
