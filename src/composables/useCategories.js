import { ref, computed } from 'vue'
import { fetchItems } from '@/api/tenders'
import { categoryLabel } from '@/utils/format'

/**
 * API da kategoriyalar ro'yxati uchun alohida endpoint yo'q, `category` filtri esa
 * aynan mos kelishni talab qiladi. Shuning uchun qiymatlarni ma'lumotning o'zidan yig'amiz:
 * ilova ochilganda bir marta katta sahifa olib "urug'lantiramiz", keyin har bir
 * javobdan yangi kategoriyalarni qo'shib boramiz.
 */

const known = ref(new Set())
const loading = ref(false)
let seeded = false

export function useCategories() {
  /** Har bir /items javobidan yangi kategoriyalarni yig'ib boradi */
  function collect(items = []) {
    let changed = false
    for (const it of items) {
      if (it?.category && !known.value.has(it.category)) {
        known.value.add(it.category)
        changed = true
      }
    }
    if (changed) known.value = new Set(known.value)   // reaktivlik uchun
  }

  /** Ilova ochilganda — bitta katta sahifa, faqat kategoriyalarni bilib olish uchun */
  async function seed(force = false) {
    if (seeded && !force) return
    seeded = true
    loading.value = true
    try {
      const data = await fetchItems({ page_size: 100, sort: 'newest' })
      collect(data?.items ?? [])
    } catch {
      seeded = false   // keyingi urinishda qayta harakat qilsin
    } finally {
      loading.value = false
    }
  }

  /** Select uchun: 'general' oldinda, qolganlari alifbo bo'yicha */
  const options = computed(() => {
    const list = [...known.value].sort((a, b) => {
      if (a === 'general') return -1
      if (b === 'general') return 1
      return a.localeCompare(b, 'ru')
    })
    return [
      { value: '', label: 'Barcha kategoriyalar' },
      ...list.map(v => ({ value: v, label: categoryLabel(v) }))
    ]
  })

  return { options, loading, collect, seed }
}
