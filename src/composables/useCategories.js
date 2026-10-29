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

  /** Select uchun: alifbo bo'yicha, "Boshqa" oxirida, yonida soni */
  const options = computed(() => {
    const sorted = [...list.value].sort((a, b) => {
      if (a.category === OTHER) return 1
      if (b.category === OTHER) return -1
      return a.category.localeCompare(b.category, 'uz')
    })
    return [
      { value: '', label: 'Barcha kategoriyalar' },
      ...sorted.map(c => ({ value: c.category, label: `${c.category} (${c.count})` }))
    ]
  })

  return { options, loading, load }
}
