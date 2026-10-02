<script setup>
import SearchBar from './SearchBar.vue'
import LawCard from './LawCard.vue'
import EmptyState from './EmptyState.vue'
import PaginationBar from './PaginationBar.vue'
import TenderSkeleton from './TenderSkeleton.vue'
import { formatNumber } from '@/utils/format'

/**
 * Qonunchilik yangiliklari sahifasi.
 * Tenderlardan sodda: saralash yo'q (API doim yangi → eski beradi),
 * filtrlar faqat matn qidiruvi va hujjat sanasi oralig'i.
 */
defineProps({
  items:      { type: Array, default: () => [] },
  total:      { type: Number, default: 0 },
  page:       { type: Number, required: true },
  pageSize:   { type: Number, required: true },
  totalPages: { type: Number, required: true },
  loading:    { type: Boolean, default: false },
  error:      { type: String, default: null },
  filters:    { type: Object, required: true }
})

const emit = defineEmits(['search', 'search-debounced', 'apply', 'reset', 'go'])
</script>

<template>
  <div class="laws">
    <SearchBar
      v-model="filters.q"
      :loading="loading"
      placeholder="Hujjat nomi, organ yoki raqam bo'yicha qidiring…"
      label="Qonun hujjatlarini qidirish"
      @search="emit('search')"
      @input-debounced="emit('search-debounced')"
    />

    <div class="bar">
      <h2 class="bar__title">
        <template v-if="loading">Yuklanmoqda…</template>
        <template v-else-if="total">
          <strong class="mono">{{ formatNumber(total) }}</strong> ta hujjat
        </template>
        <template v-else>Qonunchilik yangiliklari</template>
      </h2>

      <div class="dates">
        <label class="dates__row">
          <span>dan</span>
          <input v-model="filters.dateFrom" class="field field--sm" type="date" @change="emit('apply')" />
        </label>
        <label class="dates__row">
          <span>gacha</span>
          <input v-model="filters.dateTo" class="field field--sm" type="date" @change="emit('apply')" />
        </label>
        <button
          v-if="filters.dateFrom || filters.dateTo || filters.q"
          class="btn btn--ghost btn--icon btn--sm"
          title="Filtrlarni tozalash"
          @click="emit('reset')"
        >
          <i class="ti ti-filter-off" />
        </button>
      </div>
    </div>

    <TenderSkeleton v-if="loading" :count="6" />

    <EmptyState
      v-else-if="error"
      tone="error"
      icon="ti-plug-connected-x"
      title="Server bilan aloqa yo'q"
      :message="`${error}. Backend ishlayotganini tekshiring.`"
      action-text="Qayta urinish"
      @action="emit('search')"
    />

    <EmptyState
      v-else-if="!items.length"
      icon="ti-gavel"
      title="Hujjat topilmadi"
      message="Qidiruv so'zi yoki sana oralig'ini o'zgartirib ko'ring."
      action-text="Filtrlarni tozalash"
      @action="emit('reset')"
    />

    <TransitionGroup v-else name="list" tag="div" class="list">
      <LawCard
        v-for="(law, i) in items"
        :key="law.id ?? law.external_id"
        :law="law"
        :index="i"
      />
    </TransitionGroup>

    <PaginationBar
      v-if="!loading && !error"
      :page="page"
      :total-pages="totalPages"
      :total="total"
      :page-size="pageSize"
      @go="n => emit('go', n)"
    />
  </div>
</template>

<style scoped>
.laws { display: flex; flex-direction: column; gap: 16px; }

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.bar__title { font-size: 14px; font-weight: 500; color: var(--text-2); }
.bar__title strong { color: var(--text); font-weight: 700; }

.dates { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dates__row { display: flex; align-items: center; gap: 7px; }
.dates__row span { font-size: 12px; color: var(--text-3); }
.dates .field--sm { height: 32px; width: auto; font-size: 12.5px; }

.list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
