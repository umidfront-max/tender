<script setup>
import { ref, watch, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import StatsBar from '@/components/StatsBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import ResultToolbar from '@/components/ResultToolbar.vue'
import TenderList from '@/components/TenderList.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { useTenders } from '@/composables/useTenders'
import { useSources } from '@/composables/useSources'
import { useCategories } from '@/composables/useCategories'

const {
  filters, sort, page, pageSize,
  items, total, loading, error,
  isSearchMode, totalPages, activeFilterCount, stats,
  load, apply, applyDebounced, goTo, toggleDomain, reset
} = useTenders()

const { sources, loading: sourcesLoading, load: loadSources, resolve } = useSources()
const { options: categories, collect, seed: seedCategories } = useCategories()

// API da kategoriyalar endpointi yo'q — qiymatlarni javoblardan yig'amiz
watch(items, collect)

const sidebarOpen = ref(false)
const refreshing = ref(false)

watch(pageSize, apply)

// Sidebar ochiq bo'lsa fon scroll qilmasin
watch(sidebarOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

async function refresh() {
  refreshing.value = true
  await Promise.all([loadSources(true), seedCategories(true), load()])
  refreshing.value = false
}

function onApply() {
  sidebarOpen.value = false
  apply()
}

function onReset() {
  sidebarOpen.value = false
  reset()
}

function onToggleDomain(domain) {
  toggleDomain(domain)
}

onMounted(() => {
  loadSources()
  seedCategories()
  load()
})
</script>

<template>
  <div class="app">
    <AppHeader
      :refreshing="refreshing"
      :online="!error"
      @refresh="refresh"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="shell">
      <FilterSidebar
        v-model:filters="filters"
        :sources="sources"
        :sources-loading="sourcesLoading"
        :categories="categories"
        :active-count="activeFilterCount"
        :open="sidebarOpen"
        @apply="onApply"
        @reset="onReset"
        @toggle-domain="onToggleDomain"
        @close="sidebarOpen = false"
      />

      <main class="main">
        <div class="main__inner">
          <SearchBar
            v-model="filters.q"
            :loading="loading"
            @search="apply"
            @input-debounced="applyDebounced"
          />

          <StatsBar
            :stats="stats"
            :search-mode="isSearchMode"
            :loading="loading"
          />

          <section class="results">
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
              @retry="refresh"
              @reset="reset"
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

.results { display: flex; flex-direction: column; }

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
