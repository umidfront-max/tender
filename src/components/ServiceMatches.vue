<script setup>
import TenderList from './TenderList.vue'
import PaginationBar from './PaginationBar.vue'
import { formatNumber } from '@/utils/format'
import { MATCH_THRESHOLD } from '@/composables/useTenders'

/** Bitta xizmatga mos tenderlar — /services/{id}/matches */
defineProps({
  service:    { type: Object, required: true },
  items:      { type: Array, default: () => [] },
  total:      { type: Number, default: 0 },
  page:       { type: Number, default: 1 },
  pageSize:   { type: Number, default: 12 },
  totalPages: { type: Number, default: 1 },
  loading:    { type: Boolean, default: false },
  error:      { type: String, default: null },
  resolve:    { type: Function, required: true },
  busyIds:    { type: Object, default: () => new Set() }
})

const emit = defineEmits(['back', 'go', 'retry', 'interest'])
</script>

<template>
  <div class="sm">
    <div class="sm__head">
      <button class="btn btn--ghost btn--sm" @click="emit('back')">
        <i class="ti ti-arrow-left" />Xizmatlar
      </button>

      <div class="sm__info">
        <h2 class="sm__name">{{ service.name }}</h2>
        <p class="sm__sub">
          <i class="ti ti-sparkles" />
          <template v-if="loading">Yuklanmoqda…</template>
          <template v-else>
            <strong class="mono">{{ formatNumber(total) }}</strong> ta tender, moslik {{ MATCH_THRESHOLD }}% dan yuqori
          </template>
        </p>
      </div>
    </div>

    <TenderList
      :items="items"
      :loading="loading"
      :error="error"
      :resolve="resolve"
      :busy-ids="busyIds"
      @retry="emit('retry')"
      @reset="emit('back')"
      @interest="(it, val) => emit('interest', it, val)"
    />

    <PaginationBar
      v-if="!loading && !error"
      :page="page"
      :total-pages="totalPages"
      :total="total"
      :page-size="pageSize"
      @go="p => emit('go', p)"
    />
  </div>
</template>

<style scoped>
.sm { display: flex; flex-direction: column; gap: 16px; }

.sm__head { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.sm__info { flex: 1; min-width: 0; }
.sm__name { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.45; }
.sm__sub {
  display: flex; align-items: center; gap: 5px;
  margin-top: 3px;
  font-size: 12px; color: var(--text-2);
}
.sm__sub i { font-size: 13px; color: var(--text-3); }
.sm__sub strong { color: var(--text); font-weight: 700; }
</style>
