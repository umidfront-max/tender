<script setup>
import { computed } from 'vue'
import { formatNumber, formatCompact } from '@/utils/format'

const props = defineProps({
  stats:      { type: Object, required: true },
  searchMode: { type: Boolean, default: false },
  loading:    { type: Boolean, default: false }
})

const cards = computed(() => [
  {
    key: 'total',
    label: 'Topilgan tenderlar',
    value: formatNumber(props.stats.total),
    hint: props.searchMode ? "qidiruv bo'yicha" : "filtr bo'yicha",
    icon: 'ti-files',
    tone: 'blue'
  },
  {
    key: 'today',
    label: "Bugun qo'shilgan",
    value: formatNumber(props.stats.today),
    hint: 'joriy sahifada',
    icon: 'ti-sparkles',
    tone: 'green'
  },
  {
    key: 'deadline',
    label: 'Muddati yaqin',
    value: formatNumber(props.stats.deadlineSoon),
    hint: '7 kun ichida tugaydi',
    icon: 'ti-hourglass',
    tone: 'amber'
  },
  {
    key: 'sum',
    label: 'Umumiy summa',
    value: formatCompact(props.stats.sumUzs) ?? '—',
    // Narx UZS/USD/EUR da keladi — aralashtirmaslik uchun faqat UZS
    hint: `UZS · ${props.stats.pricedCount} ta narxli`,
    icon: 'ti-coins',
    tone: 'violet'
  }
])
</script>

<template>
  <section class="stats" aria-label="Umumiy ko'rsatkichlar">
    <article
      v-for="(c, i) in cards"
      :key="c.key"
      class="stat"
      :class="`stat--${c.tone}`"
      :style="{ animationDelay: `${i * 55}ms` }"
    >
      <span class="stat__icon"><i class="ti" :class="c.icon" /></span>
      <div class="stat__body">
        <span class="stat__label">{{ c.label }}</span>
        <span class="stat__value mono" :class="{ 'is-loading': loading }">{{ c.value }}</span>
        <span class="stat__hint">{{ c.hint }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  animation: fade-up .45s var(--ease-out) both;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.stat::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--tone);
  opacity: .9;
}
.stat:hover { border-color: var(--border-strong); box-shadow: var(--sh-md); transform: translateY(-1px); }

.stat--blue   { --tone: var(--brand-600); --tone-bg: var(--accent-bg); }
.stat--green  { --tone: var(--ok-500);    --tone-bg: var(--ok-bg); }
.stat--amber  { --tone: var(--warn-500);  --tone-bg: var(--warn-bg); }
.stat--violet { --tone: var(--violet-500);--tone-bg: color-mix(in srgb, var(--violet-500) 10%, transparent); }

.stat__icon {
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border-radius: var(--r-md);
  background: var(--tone-bg);
  color: var(--tone);
  font-size: 17px;
  flex-shrink: 0;
}

.stat__body { display: flex; flex-direction: column; min-width: 0; }
.stat__label {
  font-size: 10.5px; font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .55px;
}
.stat__value {
  font-size: 21px; font-weight: 700;
  letter-spacing: -.5px;
  line-height: 1.25;
  margin-top: 2px;
  transition: opacity var(--dur) var(--ease);
}
.stat__value.is-loading { opacity: .35; }
.stat__hint { font-size: 11px; color: var(--text-3); margin-top: 1px; }

@media (max-width: 1100px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 460px)  { .stats { grid-template-columns: 1fr; } }
</style>
