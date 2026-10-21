<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import StatsBar from '@/components/StatsBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import InterestTabs from '@/components/InterestTabs.vue'
import ResultToolbar from '@/components/ResultToolbar.vue'
import TenderList from '@/components/TenderList.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LawsView from '@/components/LawsView.vue'
import ServicesView from '@/components/ServicesView.vue'
import ServiceMatches from '@/components/ServiceMatches.vue'
import { useTenders } from '@/composables/useTenders'
import { useSources } from '@/composables/useSources'
import { useCategories } from '@/composables/useCategories'
import { useStats } from '@/composables/useStats'
import { useCollect } from '@/composables/useCollect'
import { useLaws } from '@/composables/useLaws'
import { useServices } from '@/composables/useServices'
import { useServiceMatches } from '@/composables/useServiceMatches'

const {
  filters, tab, sort, page, pageSize,
  items, total, loading, error,
  isSearchMode, totalPages, activeFilterCount,
  load, apply, applyDebounced, goTo, toggleDomains, setInterest, reset
} = useTenders()

const { sources, groups, load: loadSources, resolve } = useSources()
const { options: categories, collect: collectCategories, seed: seedCategories } = useCategories()
const { stats, loading: statsLoading, load: loadStats, shift: shiftStats } = useStats()

// API da kategoriyalar endpointi yo'q — qiymatlarni javoblardan yig'amiz
watch(items, collectCategories)

const sidebarOpen = ref(false)

/** Faol bo'lim: government | bank | laws | services */
const view = ref('government')

/** Tenderlar ko'rinadigan bo'limlar */
const isTenderView = computed(() => view.value === 'government' || view.value === 'bank')
filters.sector = 'government'

/** Joriy toifadagi manbalar — stats va sidebar ro'yxati shulardan tuziladi */
const viewGroups = computed(() =>
  isTenderView.value ? groups.value.filter(g => g.sector === view.value) : []
)

/** Sidebar ro'yxati: Davlat'da saytlar, Banklar'da banklar */
const viewSources = computed(() =>
  isTenderView.value ? sources.value.filter(s => s.sector === view.value) : []
)

const {
  items: services, loading: servicesLoading, saving: servicesSaving,
  error: servicesError, loaded: servicesLoaded,
  load: loadServices, add: addService, edit: editService, remove: removeService
} = useServices()

/** Xizmatlar bo'limida bitta xizmatga mos tenderlar ko'rinishi */
const {
  service: matchService, page: matchPage, pageSize: matchPageSize,
  items: matchItems, total: matchTotal, totalPages: matchTotalPages,
  loading: matchLoading, error: matchError,
  load: loadMatches, open: openMatches, close: closeMatches, goTo: goToMatch
} = useServiceMatches()

const {
  filters: lawFilters, page: lawPage, pageSize: lawPageSize,
  items: lawItems, total: lawTotal, totalPages: lawTotalPages,
  loading: lawsLoading, error: lawsError, loaded: lawsLoaded,
  load: loadLaws, apply: applyLaws, applyDebounced: applyLawsDebounced,
  goTo: goToLaw, reset: resetLaws
} = useLaws()

watch(view, (v) => {
  // Mobil drawer ochiq qolsa body scroll qulfi osilib qoladi
  sidebarOpen.value = false
  closeMatches()

  // Qonunlar va xizmatlar birinchi marta ochilgandagina yuklanadi
  if (v === 'laws') {
    if (!lawsLoaded.value) loadLaws()
    return
  }
  if (v === 'services') {
    if (!servicesLoaded.value) loadServices()
    return
  }

  // Toifa almashdi: tanlangan manbalar boshqa toifaga tegishli edi, tozalaymiz
  filters.sector = v
  filters.domains = []
  apply()
})

/** Xizmat qo'shildi/o'zgardi — forma tozalansin */
async function onAddService(body, done) {
  if (await addService(body)) done()
}
async function onEditService(id, body, done) {
  if (await editService(id, body)) done()
}

/**
 * Stats faqat manba va kategoriyaga bog'liq — sahifa almashganda qayta so'ralmaydi.
 *
 * /items/stats `sector` parametrini qabul qilmaydi, shuning uchun toifani
 * o'sha toifadagi domenlar ro'yxati orqali uzatamiz — aks holda tab sonlari
 * butun bazani sanab, ro'yxat bilan mos kelmay qolardi.
 */
const statsParams = computed(() => {
  const domains = filters.domains.length
    ? filters.domains
    : viewGroups.value.flatMap(g => g.domains)

  return {
    domain: domains.length ? domains.join(',') : undefined,
    category: filters.category || undefined
  }
})

watch(statsParams, (p) => loadStats(p), { deep: true })
watch(pageSize, apply)

// Sidebar ochiq bo'lsa fon scroll qilmasin
watch(sidebarOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

/**
 * Yig'ish tugagach hamma narsa yangilanadi.
 * POST /collect qonunlarni ham birga yig'adi, shuning uchun ular ham qayta so'raladi.
 */
function reloadAll() {
  load()
  loadStats(statsParams.value)
  if (lawsLoaded.value) loadLaws()
}

const {
  running: collecting, cooldown, message: collectMessage,
  start: startCollect, probe: probeCollect
} = useCollect(reloadAll)

/** PATCH so'rovi ketayotgan tenderlar — tugmalari bloklanadi */
const busyIds = ref(new Set())

async function onInterest(item, value) {
  if (busyIds.value.has(item.id)) return
  busyIds.value = new Set(busyIds.value).add(item.id)

  try {
    const prev = await setInterest(item, value)
    shiftStats(prev, value)
  } catch {
    // setInterest o'zi eski holatni qaytardi; qo'shimcha xabar shart emas
  } finally {
    const next = new Set(busyIds.value)
    next.delete(item.id)
    busyIds.value = next
  }
}

function onApply() {
  sidebarOpen.value = false
  apply()
}

function onReset() {
  sidebarOpen.value = false
  reset()
}

function onToggleDomains(domains) {
  toggleDomains(domains)
}

onMounted(() => {
  loadSources()
  seedCategories()
  loadStats(statsParams.value)
  load()
  probeCollect()   // boshqa joyda yig'ish ketayotgan bo'lsa ulanib olamiz
})
</script>

<template>
  <div class="app">
    <AppHeader
      v-model="view"
      :collecting="collecting"
      :cooldown="cooldown"
      :message="collectMessage"
      :online="!error"
      @collect="startCollect"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="shell" :class="{ 'shell--wide': !isTenderView }">
      <!-- v-show emas, v-if: FilterSidebar ikki ildizli (fragment) komponent,
           unga v-show qo'llanmaydi va sidebar grid'da qolib ketadi -->
      <FilterSidebar
        v-if="isTenderView"
        v-model:filters="filters"
        :categories="categories"
        :sources="viewSources"
        :selected="filters.domains"
        :source-label="view === 'bank' ? 'Bank' : 'Manba'"
        :active-count="activeFilterCount"
        :open="sidebarOpen"
        @apply="onApply"
        @reset="onReset"
        @close="sidebarOpen = false"
        @toggle-domain="d => onToggleDomains([d])"
        @clear-domains="onToggleDomains([])"
      />

      <main class="main">
        <div v-if="view === 'services'" class="main__inner">
          <ServiceMatches
            v-if="matchService"
            :service="matchService"
            :items="matchItems"
            :total="matchTotal"
            :page="matchPage"
            :page-size="matchPageSize"
            :total-pages="matchTotalPages"
            :loading="matchLoading"
            :error="matchError"
            :resolve="resolve"
            :busy-ids="busyIds"
            @back="closeMatches"
            @go="goToMatch"
            @retry="loadMatches"
            @interest="onInterest"
          />

          <ServicesView
            v-else
            :items="services"
            :loading="servicesLoading"
            :saving="servicesSaving"
            :error="servicesError"
            @add="onAddService"
            @edit="onEditService"
            @remove="removeService"
            @retry="loadServices"
            @matches="openMatches"
          />
        </div>

        <div v-else-if="view === 'laws'" class="main__inner">
          <LawsView
            :items="lawItems"
            :total="lawTotal"
            :page="lawPage"
            :page-size="lawPageSize"
            :total-pages="lawTotalPages"
            :loading="lawsLoading"
            :error="lawsError"
            :filters="lawFilters"
            @search="applyLaws"
            @search-debounced="applyLawsDebounced"
            @apply="applyLaws"
            @reset="resetLaws"
            @go="goToLaw"
          />
        </div>

        <div v-else class="main__inner">
          <SearchBar
            v-model="filters.q"
            :loading="loading"
            @search="apply"
            @input-debounced="applyDebounced"
          />

          <StatsBar :stats="stats" :loading="statsLoading" />

          <section class="results">
            <InterestTabs
              v-model="tab"
              :stats="stats"
              :stats-loading="statsLoading"
            />

            <ResultToolbar
              v-model:sort="sort"
              v-model:page-size="pageSize"
              :total="total"
              :loading="loading"
              :search-mode="isSearchMode"
              :active-count="activeFilterCount"
              @open-filters="sidebarOpen = true"
            />

            <TenderList
              :items="items"
              :loading="loading"
              :error="error"
              :resolve="resolve"
              :busy-ids="busyIds"
              @retry="reloadAll"
              @reset="reset"
              @interest="onInterest"
            />

            <PaginationBar
              v-if="!loading && !error"
              :page="page"
              :total-pages="totalPages"
              :total="total"
              :page-size="pageSize"
              @go="goTo"
            />
          </section>
        </div>

        <footer class="foot">
          <span>TenderHub UZ — O'zbekiston tenderlarini yagona oynadan kuzatish</span>
          <span class="foot__dot">·</span>
          <span class="mono">{{ sources.length }} manba ulangan</span>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }

.shell {
  flex: 1;
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  align-items: start;
}

/* Qonunlar bo'limida sidebar yo'q — butun kenglik ro'yxatga beriladi */
.shell--wide { grid-template-columns: minmax(0, 1fr); }

.main { min-width: 0; display: flex; flex-direction: column; min-height: calc(100vh - var(--header-h)); }

.main__inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 1120px;
  padding: 22px 26px 32px;
  margin: 0 auto;
}

.results { display: flex; flex-direction: column; gap: 16px; }

.foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 20px 26px 26px;
  font-size: 11.5px;
  color: var(--text-3);
  border-top: 1px solid var(--border);
}
.foot__dot { opacity: .5; }

@media (max-width: 900px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .main__inner { padding: 16px 14px 28px; gap: 14px; }
}
</style>
