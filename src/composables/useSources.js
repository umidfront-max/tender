import { ref, computed } from 'vue'
import { fetchSources } from '@/api/tenders'

const PALETTE = [
  '#2563eb', '#059669', '#d97706', '#db2777',
  '#7c3aed', '#0891b2', '#dc2626', '#65a30d'
]

const sources = ref([])
const loading = ref(false)
const error = ref(null)
let loaded = false

export function useSources() {
  async function load(force = false) {
    if (loaded && !force) return
    loading.value = true
    error.value = null
    try {
      const data = await fetchSources()
      sources.value = (Array.isArray(data) ? data : [])
        .filter(s => s.enabled !== false)
        .map((s, i) => ({ ...s, color: PALETTE[i % PALETTE.length] }))
      loaded = true
    } catch (e) {
      error.value = e.message
      sources.value = []
    } finally {
      loading.value = false
    }
  }

  /** domain -> source obyekti xaritasi */
  const byDomain = computed(() =>
    Object.fromEntries(sources.value.map(s => [s.domain, s]))
  )

  function resolve(domain) {
    return byDomain.value[domain] ?? { name: domain || '—', domain, color: '#6e7788' }
  }

  return { sources, loading, error, load, resolve, byDomain }
}
