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
      // kind standart qiymati `tender` — lex.uz bu ro'yxatga tushmaydi
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

  /**
   * `parent` bo'yicha guruhlar: masalan UZEX ostida 3 ta sub-manba bor,
   * ular sidebarda birga ko'rsatilishi kerak. Parentsiz manba o'zi bitta guruh.
   */
  const groups = computed(() => {
    const out = []
    const byParent = new Map()

    for (const s of sources.value) {
      if (!s.parent) {
        out.push({
          key: s.domain,
          name: s.name,
          sector: s.sector,
          color: s.color,
          domains: [s.domain],
          children: []          // bitta manba — ichki ro'yxat kerak emas
        })
        continue
      }

      let g = byParent.get(s.parent)
      if (!g) {
        g = {
          key: `parent:${s.parent}`,
          name: s.parent,
          sector: s.sector,
          color: s.color,
          domains: [],
          children: []
        }
        byParent.set(s.parent, g)
        out.push(g)
      }
      g.domains.push(s.domain)
      g.children.push(s)
    }

    return out
  })

  /** domain -> source obyekti xaritasi */
  const byDomain = computed(() =>
    Object.fromEntries(sources.value.map(s => [s.domain, s]))
  )

  function resolve(domain) {
    return byDomain.value[domain] ?? { name: domain || '—', domain, color: '#6e7788' }
  }

  return { sources, groups, loading, error, load, resolve, byDomain }
}
