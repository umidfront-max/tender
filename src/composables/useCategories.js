import { ref, computed } from 'vue'
import { fetchCategories } from '@/api/tenders'

/**
 * Kategoriya filtri qiymatlari — GET /items/categories dan.
 * Backend nomlarni o'zi bir xil qisqa ko'rinishga (uz) keltiradi,
 * aniqlanmaganlar "Boshqa" ga tushadi. `category` filtri aynan mos kelishni
 * talab qiladi, shuning uchun qiymatni o'zgartirmasdan yuboramiz.
 */

const list = ref([])   // [{ category, count }]
const loading = ref(false)
let loaded = false

const OTHER = 'Boshqa'

/** Bizning yo'nalishlar — ro'yxat boshida, aynan shu tartibda */
const PINNED = Object.freeze([
  "Dasturiy ta'minot ishlab chiqish",
  'IT xizmatlari',
  'Telekommunikatsiya',
  'Kompyuter va elektronika'
])

export function useCategories() {
  /** @param {boolean} [force]  yig'ishdan keyin sonlarni yangilash uchun */
  async function load(force = false) {
    if (loaded && !force) return
    loaded = true
    loading.value = true
    try {
      const data = await fetchCategories()
      list.value = Array.isArray(data) ? data.filter(c => c?.category) : []
    } catch {
      loaded = false   // keyingi urinishda qayta harakat qilsin
    } finally {
      loading.value = false
    }
  }

  /** Select uchun: PINNED boshida, qolgani alifbo bo'yicha, "Boshqa" oxirida */
  const options = computed(() => {
    const rank = c => {
      const i = PINNED.indexOf(c)
      if (i !== -1) return i
      return c === OTHER ? PINNED.length + 1 : PINNED.length
    }
    const sorted = [...list.value].sort((a, b) =>
      rank(a.category) - rank(b.category) || a.category.localeCompare(b.category, 'uz')
    )
    return [
      { value: '', label: 'Barcha kategoriyalar' },
      ...sorted.map(c => ({ value: c.category, label: `${c.category} (${c.count})` }))
    ]
  })

  return { options, loading, load }
}
