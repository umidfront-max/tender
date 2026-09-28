<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  total:      { type: Number, default: 0 },
  loading:    { type: Boolean, default: false },
  searchMode: { type: Boolean, default: false },
  activeCount:{ type: Number, default: 0 }
})

const sort = defineModel('sort', { type: String, required: true })
const pageSize = defineModel('pageSize', { type: Number, required: true })
defineEmits(['open-filters'])

/**
 * API SortOrder qiymatlari. Bo'sh qiymatda `sort` parametri yuborilmaydi va
 * backend o'zi tanlaydi: qidiruvda moslik, oddiy ro'yxatda eng yangilari.
 */
const options = computed(() => [
  { value: '', label: props.searchMode ? 'Avto — moslik' : 'Avto — eng yangi' },
  ...(props.searchMode ? [{ value: 'relevance', label: 'Moslik bo\'yicha' }] : []),
  { value: 'newest',     label: 'Eng yangi' },
  { value: 'oldest',     label: 'Eng eski' },
  { value: 'price_desc', label: 'Narx: yuqoridan' },
  { value: 'price_asc',  label: 'Narx: pastdan' }
])
</script>

<template>
  <div class="bar">
    <div class="bar__left">
      <button class="bar__filters btn btn--ghost btn--sm" @click="$emit('open-filters')">
        <i class="ti ti-filter" />
        Filtrlar
        <span v-if="activeCount" class="bar__badge">{{ activeCount }}</span>
      </button>

      <h2 class="bar__title">
        <template v-if="loading">Yuklanmoqda…</template>
        <template v-else-if="total">
          <strong class="mono">{{ formatNumber(total) }}</strong> ta tender
          <span v-if="searchMode" class="bar__tag">qidiruv natijasi</span>
        </template>
        <template v-else>Tenderlar</template>
      </h2>
    </div>

    <div class="bar__right">
      <label class="ctl">
        <span>Saralash</span>
        <select v-model="sort" class="field field--sm">
          <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>

      <label class="ctl ctl--size">
        <span>Ko'rsatish</span>
        <select v-model.number="pageSize" class="field field--sm">
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </label>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

}

.bar__left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.bar__filters { display: none; }
.bar__badge {
  min-width: 16px; height: 16px; padding: 0 4px;
  display: grid; place-items: center;
  background: var(--accent); color: var(--on-accent);
  border-radius: var(--r-full);
  font-size: 10px; font-weight: 700;
}

.bar__title { font-size: 14px; font-weight: 500; color: var(--text-2); }
.bar__title strong { color: var(--text); font-weight: 700; }
.bar__tag {
  margin-left: 6px;
  font-size: 11px; font-weight: 500;
  color: var(--accent-text);
  background: var(--accent-bg);
  padding: 2px 8px;
  border-radius: var(--r-full);
}

.bar__right { display: flex; align-items: center; gap: 12px; }

.ctl { display: flex; align-items: center; gap: 7px; }
.ctl span { font-size: 12px; color: var(--text-3); white-space: nowrap; }

.field--sm { height: 32px; width: auto; font-size: 12.5px; padding: 0 30px 0 10px; }

@media (max-width: 900px) {
  .bar__filters { display: inline-flex; }
}
@media (max-width: 620px) {
  .ctl--size { display: none; }
  .bar__title { font-size: 13px; }
}
</style>
