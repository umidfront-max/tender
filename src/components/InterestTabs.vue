<script setup>
import { TABS } from '@/composables/useTenders'
import { formatNumber } from '@/utils/format'

/**
 * Qiziqish bo'yicha tablar. Sonlar GET /api/v1/items/stats dan keladi —
 * front o'zi hisoblamaydi, shuning uchun ular butun baza bo'yicha, joriy sahifa emas.
 */
defineProps({
  stats:        { type: Object, required: true },
  statsLoading: { type: Boolean, default: false }
})

const active = defineModel({ type: String, required: true })
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="t in TABS"
      :key="t.value"
      class="tab"
      :class="[`tab--${t.value}`, { 'tab--on': active === t.value }]"
      role="tab"
      :aria-selected="active === t.value"
      @click="active = t.value"
    >
      <i class="ti" :class="t.icon" />
      <span class="tab__label">{{ t.label }}</span>
      <span class="tab__count mono" :class="{ 'is-loading': statsLoading }">
        {{ formatNumber(stats[t.count] ?? 0) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface-sunk);
  border-radius: var(--r-lg);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex: 1;
  min-width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  cursor: pointer;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  transition: background var(--dur-fast) var(--ease),
              color var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.tab i { font-size: 15px; }
.tab:hover { background: color-mix(in srgb, var(--surface) 70%, transparent); color: var(--text); }
.tab:focus-visible { outline: none; box-shadow: var(--ring); }

.tab--on {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--sh-xs);
}

/* Faol tabda tegishli rang paydo bo'ladi */
.tab--on.tab--new            { color: var(--accent-text); }
.tab--on.tab--new i          { color: var(--accent); }
.tab--on.tab--interested     { color: var(--ok-fg); }
.tab--on.tab--interested i   { color: var(--ok-fg); }
.tab--on.tab--not_interested { color: var(--text-2); }

.tab__count {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: var(--r-full);
  background: color-mix(in srgb, var(--text-3) 14%, transparent);
  font-size: 10.5px;
  font-weight: 700;
  transition: opacity var(--dur) var(--ease);
}
.tab__count.is-loading { opacity: .4; }
.tab--on .tab__count { background: color-mix(in srgb, currentColor 14%, transparent); }

@media (max-width: 620px) {
  .tab { padding: 8px 10px; }
  .tab__label { display: none; }
  .tab--on .tab__label { display: inline; }
}
</style>
